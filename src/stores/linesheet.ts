import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import { compressAndEncodeImage, isBase64TooLarge } from '../utils/imageUtils'
import * as firestoreService from '../services/firestoreService'

export interface Product {
  id: string
  productCode: string  // ürün kodu
  productName: string  // ürün adı
  content: string      // içerik
  size: string         // beden
  price: string        // satış fiyatı
  tax: string          // kdv
  images: string[]     // Base64 encoded images
  logoUrl?: string     // Base64 encoded logo
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
  logoUrl?: string // Base64 encoded logo
}

// Helper function to generate unique enough IDs
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export const useLineSheetStore = defineStore('linesheet', () => {
  const projects = ref<LineSheetProject[]>([])
  const currentProjectId = ref<string | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const currentProject = computed(() => {
    return projects.value.find(project => project.id === currentProjectId.value) || null
  })

  // Load all projects from Firestore when the store is first used
  const loadProjects = async () => {
    isLoading.value = true;
    error.value = null;
    
    try {
      const fetchedProjects = await firestoreService.getProjects();
      projects.value = fetchedProjects;
    } catch (err) {
      console.error('Failed to load projects:', err);
      error.value = 'Failed to load projects';
    } finally {
      isLoading.value = false;
    }
  };

  // Initial load
  loadProjects();

  async function createProject(name: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const id = Date.now().toString();
      const project: LineSheetProject = {
        id,
        name,
        createdAt: new Date(),
        products: [],
        designerName: '',
        collection: '',
        phone: '',
        email: '',
        logoUrl: ''
      };
      
      // Save to Firestore
      const success = await firestoreService.saveProject(project);
      
      if (success) {
        projects.value.push(project);
        currentProjectId.value = id;
        return id;
      } else {
        throw new Error('Failed to save project');
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      error.value = 'Failed to create project';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadProject(id: string) {
    // First check local cache
    if (projects.value.some(p => p.id === id)) {
      currentProjectId.value = id;
      return;
    }
    
    // Not in local cache, try to fetch from Firestore
    isLoading.value = true;
    error.value = null;
    
    try {
      const project = await firestoreService.getProject(id);
      
      if (project) {
        // Add to local cache if not already there
        if (!projects.value.some(p => p.id === project.id)) {
          projects.value.push(project);
        }
        currentProjectId.value = id;
      } else {
        console.error(`Project with id ${id} not found.`);
        currentProjectId.value = null;
      }
    } catch (err) {
      console.error(`Error loading project ${id}:`, err);
      error.value = `Failed to load project`;
      currentProjectId.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  async function deleteProject(id: string) {
    isLoading.value = true;
    error.value = null;
    
    try {
      const success = await firestoreService.deleteProject(id);
      
      if (success) {
        const index = projects.value.findIndex(project => project.id === id);
        if (index !== -1) {
          projects.value.splice(index, 1);
          if (currentProjectId.value === id) {
            currentProjectId.value = projects.value.length > 0 ? projects.value[0].id : null;
          }
        }
      } else {
        throw new Error('Failed to delete project');
      }
    } catch (err) {
      console.error(`Error deleting project ${id}:`, err);
      error.value = 'Failed to delete project';
    } finally {
      isLoading.value = false;
    }
  }

  // Save current project to Firestore
  async function saveCurrentProject() {
    if (!currentProject.value) return false;
    
    isLoading.value = true;
    error.value = null;
    
    try {
      const success = await firestoreService.saveProject(currentProject.value);
      return success;
    } catch (err) {
      console.error('Failed to save project:', err);
      error.value = 'Failed to save project';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  // Function to update non-product details
  async function updateProjectDetails(details: Partial<Omit<LineSheetProject, 'products' | 'id' | 'createdAt'>>) {
    if (!currentProject.value) return;
    
    for (const key in details) {
      if (Object.prototype.hasOwnProperty.call(details, key) && key in currentProject.value) {
        const detailKey = key as keyof typeof details;
        (currentProject.value as any)[detailKey] = details[detailKey];
      }
    }
    
    await saveCurrentProject();
  }

  // Function to update logo
  async function updateLogo(logoFile: File | null) {
    if (!currentProject.value) return;
    
    try {
      if (logoFile) {
        const base64Logo = await compressAndEncodeImage(logoFile);
        
        if (isBase64TooLarge(base64Logo)) {
          error.value = 'Logo is too large (max 1MB). Please try a smaller image.';
          return;
        }
        
        currentProject.value.logoUrl = base64Logo;
      } else {
        currentProject.value.logoUrl = '';
      }
      
      await saveCurrentProject();
    } catch (err) {
      console.error('Error processing logo:', err);
      error.value = 'Failed to process logo';
    }
  }

  function importCSV(csvData: string) {
    if (!currentProject.value) return;

    // Parse CSV data
    const lines = csvData.split('\n');
    // Skip header row
    const products: Product[] = [];

    // Simple CSV parsing
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple split by comma
      const values = line.split(',');
      
      if (values.length >= 6) {
        products.push({
          id: generateId(),
          productCode: values[0].trim(),
          productName: values[1].trim(),
          content: values[2].trim(),
          size: values[3].trim(),
          price: values[4].trim(),
          tax: values[5].trim(),
          images: [] // Start with no images
        });
      }
    }

    currentProject.value.products = products;
    saveCurrentProject();
  }

  async function addImagesToProduct(productId: string, files: File[]) {
    if (!currentProject.value) return;
    
    const product = currentProject.value.products.find(p => p.id === productId);
    if (!product) return;
    
    try {
      for (const file of files) {
        const base64Image = await compressAndEncodeImage(file);
        
        if (isBase64TooLarge(base64Image)) {
          error.value = 'One or more images are too large (max 1MB). Please try smaller images.';
          continue;
        }
        
        product.images.push(base64Image);
      }
      
      await saveCurrentProject();
    } catch (err) {
      console.error('Error processing images:', err);
      error.value = 'Failed to process images';
    }
  }

  function removeImageFromProduct(productId: string, imageIndex: number) {
    if (!currentProject.value) return;
    
    const product = currentProject.value.products.find(p => p.id === productId);
    if (product && imageIndex >= 0 && imageIndex < product.images.length) {
      product.images.splice(imageIndex, 1);
      saveCurrentProject();
    }
  }

  // --- Product CRUD --- 
  async function addProduct() {
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
    await saveCurrentProject();
  }

  async function updateProduct(productId: string, updatedProductData: Partial<Omit<Product, 'id' | 'images'>>) {
    if (!currentProject.value) return;
    
    const productIndex = currentProject.value.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      const product = currentProject.value.products[productIndex];
      // Merge updates, ensuring not to overwrite id or images here
      currentProject.value.products[productIndex] = { ...product, ...updatedProductData };
      await saveCurrentProject();
    }
  }

  async function deleteProduct(productId: string) {
    if (!currentProject.value) return;
    
    const productIndex = currentProject.value.products.findIndex(p => p.id === productId);
    if (productIndex !== -1) {
      currentProject.value.products.splice(productIndex, 1);
      await saveCurrentProject();
    }
  }
  // --- End Product CRUD ---

  // --- Reorder Products --- 
  async function reorderProducts(newOrder: Product[]) {
    if (!currentProject.value) return;
    
    // Ensure the newOrder array contains the same products, just reordered
    currentProject.value.products = newOrder;
    await saveCurrentProject();
  }
  // --- End Reorder Products --- 
  
  // --- Move Product Up/Down --- 
  async function moveProduct(productIndex: number, direction: 'up' | 'down') {
    if (!currentProject.value) return;
    
    const products = currentProject.value.products;
    const maxIndex = products.length - 1;

    if (direction === 'up' && productIndex > 0) {
      // Swap with previous item
      [products[productIndex], products[productIndex - 1]] = [products[productIndex - 1], products[productIndex]];
      await saveCurrentProject();
    } else if (direction === 'down' && productIndex < maxIndex) {
      // Swap with next item
      [products[productIndex], products[productIndex + 1]] = [products[productIndex + 1], products[productIndex]];
      await saveCurrentProject();
    }
  }
  // --- End Move Product Up/Down --- 

  return {
    projects,
    currentProjectId,
    currentProject,
    isLoading,
    error,
    loadProjects,
    createProject,
    loadProject,
    deleteProject,
    updateProjectDetails,
    updateLogo,
    importCSV,
    addProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    addImagesToProduct,
    removeImageFromProduct
  }
})
