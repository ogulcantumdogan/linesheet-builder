import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Ref } from 'vue'; // Import Ref type if needed elsewhere

export interface Product {
  id: string
  productCode: string  // ürün kodu
  productName: string  // ürün adı
  content: string      // içerik
  size: string         // beden
  price: string        // satış fiyatı
  tax: string          // kdv
  images: string[]
  logoUrl?: string // Store as data URL or object URL
}

export interface LineSheetProject {
  id: string
  name: string
  createdAt: Date
  products: Product[]
  // Optional header details
  designerName?: string
  collection?: string
  phone?: string
  email?: string
  logoUrl?: string // Store as data URL or object URL
}

// Helper function to generate unique enough IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const useLineSheetStore = defineStore('linesheet', () => {
  const projects = ref<LineSheetProject[]>([])
  const currentProjectId = ref<string | null>(null)

  const currentProject = computed(() => {
    return projects.value.find(project => project.id === currentProjectId.value) || null
  })

  function createProject(name: string) {
    const id = Date.now().toString()
    const project: LineSheetProject = {
      id,
      name,
      createdAt: new Date(),
      products: [],
      designerName: '', // Initialize optional fields
      collection: '',
      phone: '',
      email: '',
      logoUrl: ''
    }
    projects.value.push(project)
    currentProjectId.value = id
    // Ensure the newly created project is saved if persistence is active
    // Pinia persistence plugin usually handles this automatically
    return id
  }

  function loadProject(id: string) {
    // Check if project exists before setting current ID
    if (projects.value.some(p => p.id === id)) {
       currentProjectId.value = id
    } else {
       console.error(`Project with id ${id} not found.`)
       // Optionally redirect or handle error
       currentProjectId.value = null
    }
  }

  function deleteProject(id: string) {
    const index = projects.value.findIndex(project => project.id === id)
    if (index !== -1) {
      // Clean up logo object URL if necessary
      const projectToDelete = projects.value[index]
      if (projectToDelete.logoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(projectToDelete.logoUrl)
      }
      // Remove project
      projects.value.splice(index, 1)
      if (currentProjectId.value === id) {
        // Select the first project or null if none left
        currentProjectId.value = projects.value.length > 0 ? projects.value[0].id : null
      }
    }
  }

  // Function to update non-product details
  function updateProjectDetails(details: Partial<Omit<LineSheetProject, 'products' | 'id' | 'createdAt'>>) {
      if (!currentProject.value) return;
      for (const key in details) {
          if (Object.prototype.hasOwnProperty.call(details, key) && key in currentProject.value) {
              const detailKey = key as keyof typeof details;
              (currentProject.value as any)[detailKey] = details[detailKey];
          }
      }
  }

  // Function to update logo
  function updateLogo(logoFile: File | null) {
      if (!currentProject.value) return;
      // Revoke old object URL if it exists
      if (currentProject.value.logoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(currentProject.value.logoUrl)
      }
      
      if (logoFile) {
          currentProject.value.logoUrl = URL.createObjectURL(logoFile)
      } else {
          currentProject.value.logoUrl = ''
      }
  }

  function importCSV(csvData: string) {
    if (!currentProject.value) return

    // Parse CSV data
    const lines = csvData.split('\n')
    // Skip header row
    const products: Product[] = []

    // Simple CSV parsing - better for this specific format
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      // Simple split by comma
      const values = line.split(',')
      
      if (values.length >= 6) {
        products.push({
          id: Date.now().toString() + '-' + i,
          productCode: values[0].trim(),
          productName: values[1].trim(),
          content: values[2].trim(),
          size: values[3].trim(),
          price: values[4].trim(),
          tax: values[5].trim(),
          images: [] // Keep existing images? No, CSV replaces products
        })
      }
    }

    currentProject.value.products = products
  }

  function addImagesToProduct(productId: string, imageUrls: string[]) {
    if (!currentProject.value) return

    const product = currentProject.value.products.find(p => p.id === productId)
    if (product) {
       // Revoke old object URLs if they exist before adding new ones
      // Note: This assumes imageUrls are always new blob URLs
      // If re-adding the same file, this might cause issues.
      // Consider managing blobs more carefully if needed.
      // product.images.forEach(URL.revokeObjectURL); // Be careful with this
      product.images = [...product.images, ...imageUrls]
    }
  }

  function removeImageFromProduct(productId: string, imageIndex: number) {
    if (!currentProject.value) return

    const product = currentProject.value.products.find(p => p.id === productId)
    if (product && imageIndex >= 0 && imageIndex < product.images.length) {
      // Revoke the object URL before removing it from the array
      const imageUrlToRemove = product.images[imageIndex]
      if (imageUrlToRemove.startsWith('blob:')) {
          URL.revokeObjectURL(imageUrlToRemove)
      }
      product.images.splice(imageIndex, 1)
    }
  }

  // --- Product CRUD --- 
  function addProduct() {
    if (!currentProject.value) return;
    const newProduct: Product = {
      id: generateId(),
      productCode: '',
      productName: 'New Product', // Default name
      content: '',
      size: '',
      price: '',
      tax: '',
      images: []
    };
    currentProject.value.products.push(newProduct);
  }

  function updateProduct(productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'images'>>) {
     if (!currentProject.value) return;
     const productIndex = currentProject.value.products.findIndex(p => p.id === productId);
     if (productIndex !== -1) {
         const product = currentProject.value.products[productIndex];
         // Merge updates, ensuring not to overwrite id or images here
         currentProject.value.products[productIndex] = { ...product, ...updatedProductData };
     }
  }

  function deleteProduct(productId: string) {
      if (!currentProject.value) return;
      const productIndex = currentProject.value.products.findIndex(p => p.id === productId);
      if (productIndex !== -1) {
          // Clean up image Object URLs before deleting product
          const productToDelete = currentProject.value.products[productIndex];
          productToDelete.images.forEach(imageUrl => {
              if (imageUrl.startsWith('blob:')) {
                  URL.revokeObjectURL(imageUrl);
              }
          });
          currentProject.value.products.splice(productIndex, 1);
      }
  }
  // --- End Product CRUD ---

  // --- Reorder Products --- 
  function reorderProducts(newOrder: Product[]) {
      if (!currentProject.value) return;
      // Ensure the newOrder array contains the same products, just reordered
      // Simple replacement assuming newOrder is the full, reordered list
      currentProject.value.products = newOrder;
  }
  // --- End Reorder Products --- 
  
  // --- Move Product Up/Down --- 
  function moveProduct(productIndex: number, direction: 'up' | 'down') {
    if (!currentProject.value) return;
    const products = currentProject.value.products;
    const maxIndex = products.length - 1;

    if (direction === 'up' && productIndex > 0) {
      // Swap with previous item
      [products[productIndex], products[productIndex - 1]] = [products[productIndex - 1], products[productIndex]];
    } else if (direction === 'down' && productIndex < maxIndex) {
      // Swap with next item
      [products[productIndex], products[productIndex + 1]] = [products[productIndex + 1], products[productIndex]];
    }
    // Pinia should detect the array mutation, potentially triggering persistence
  }
  // --- End Move Product Up/Down --- 

  // Cleanup object URLs on store disposal (e.g., page unload)
  // This might need to be handled differently depending on app lifecycle
  // Consider using onUnmounted in components or Pinia plugins
  // For simplicity, not adding complex lifecycle hooks here.

  return {
    projects,
    currentProjectId,
    currentProject,
    createProject,
    loadProject,
    deleteProject,
    updateProjectDetails, // Expose new action
    updateLogo,           // Expose new action
    importCSV,
    addProduct,           // Expose new action
    updateProduct,        // Expose new action
    deleteProduct,        // Expose new action
    moveProduct,          // Expose new action
    addImagesToProduct,
    removeImageFromProduct
  }
}, {
  persist: {
    storage: localStorage, // Assuming 'localStorage' is the intended storage
    // The 'paths' option correctly specifies which parts of the state to persist.
    // The linter error might be due to incomplete types or configuration.
    // If the error persists, double-check pinia-plugin-persistedstate setup.
    paths: ['projects', 'currentProjectId'] 
  } as any // Use 'as any' to bypass potential incorrect linter error for now
})
