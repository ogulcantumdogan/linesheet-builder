<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
// import draggable from 'vue.draggable.next' // Removed draggable
import { useLineSheetStore, type Product, type LineSheetProject } from '../stores/linesheet'
import LoadingIndicator from '../components/LoadingIndicator.vue'

const props = defineProps<{
  id: string
}>()

const store = useLineSheetStore()
const router = useRouter()
const fileInput = ref<HTMLInputElement | null>(null)
const csvFileInput = ref<HTMLInputElement | null>(null)
const currentProductId = ref<string | null>(null)
const logoFileInput = ref<HTMLInputElement | null>(null)

// Local copy for debounced saving or direct update
const projectDetails = ref<Partial<LineSheetProject>>({})

onMounted(() => {
  store.loadProject(props.id)
  if (!store.currentProject) {
    router.push('/')
  } else {
    // Initialize local copy when project loads
    updateLocalDetails(store.currentProject)
  }
})

// Watch for changes in the store's project and update local copy
watch(() => store.currentProject, (newProject) => {
  if (newProject) {
    updateLocalDetails(newProject)
  }
}, { deep: true })

function updateLocalDetails(project: LineSheetProject) {
  projectDetails.value = {
    designerName: project.designerName,
    collection: project.collection,
    phone: project.phone,
    email: project.email
    // Don't copy logoUrl here, handle separately
  }
}

// Function to update store (can be debounced if needed)
function saveProjectDetails() {
  store.updateProjectDetails(projectDetails.value)
}

const project = computed(() => store.currentProject)

function goToHome() {
  router.push('/')
}

function previewLineSheet() {
  router.push(`/preview/${props.id}`)
}

function importCSV(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  
  const file = input.files[0]
  const reader = new FileReader()
  
  reader.onload = (e) => {
    const content = e.target?.result as string
    if (content) {
      store.importCSV(content)
    }
  }
  
  reader.readAsText(file)
  input.value = ''
}

function openImageUpload(productId: string) {
  currentProductId.value = productId
  fileInput.value?.click()
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || !currentProductId.value) return
  
  const files = Array.from(input.files)
  store.addImagesToProduct(currentProductId.value, files)
  
  input.value = ''
  currentProductId.value = null
}

function removeImage(productId: string, imageIndex: number) {
  store.removeImageFromProduct(productId, imageIndex)
}

// --- Logo Handling ---
function openLogoUpload() {
  logoFileInput.value?.click()
}

function handleLogoUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    store.updateLogo(input.files[0])
  } else {
    store.updateLogo(null) // Handle case where selection is cancelled
  }
  input.value = '' // Reset file input
}

function removeLogo() {
  store.updateLogo(null)
}
// --- End Logo Handling ---

// --- Update Product Field --- 
function updateProductField(product: Product, field: keyof Product, event: Event) {
  const target = event.target as HTMLInputElement;
  if (target) {
    store.updateProduct(product.id, { [field]: target.value });
  }
}

// --- Delete Product --- 
function confirmDeleteProduct(productId: string) {
   if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
       store.deleteProduct(productId);
   }
}

// Get product type (based on name)
function getProductType(productName: string): string {
  const name = productName.toUpperCase()
  if (name.includes('SET')) return 'SET'
  if (name.includes('DRESS')) return 'ELBISE'
  if (name.includes('CAFTAN')) return 'KAFTAN'
  return name.split(' ')[0] // First word as type if no match
}

// Get product name without type
function getCleanProductName(productName: string): string {
  return productName
}
</script>

<template>
  <div class="linesheet-container" v-if="project">
    <LoadingIndicator :show="store.isLoading" message="Saving changes..." />
    
    <div v-if="store.error" class="error-message">
      {{ store.error }}
    </div>
    
    <div class="linesheet-header">
      <button class="back-btn" @click="goToHome">← Ana Sayfaya Dön</button>
      <h1>{{ project.name }}</h1>
      <div class="actions">
        <input 
          ref="csvFileInput"
          type="file" 
          accept=".csv" 
          @change="importCSV" 
          style="display: none"
        >
        <button @click="csvFileInput?.click()">
          {{ project.products.length > 0 ? 'CSV Değiştir' : 'CSV Yükle' }}
        </button>
        <button 
          class="preview-btn" 
          @click="previewLineSheet"
          :disabled="project.products.length === 0"
        >
          Koleksiyon Föyü Önizle
        </button>
        <button @click="store.addProduct">+ Yeni Ürün Ekle</button>
      </div>
    </div>

    <!-- Project Details Section -->
    <div class="project-details-card">
      <h2>Proje Detayları</h2>
      <div class="details-grid">
        <!-- Logo Upload -->
        <div class="logo-section">
          <label>Logo:</label>
          <div class="logo-upload-area">
            <img v-if="project.logoUrl" :src="project.logoUrl" alt="Logo Preview" class="logo-preview" @click="openLogoUpload">
            <div v-else class="logo-placeholder" @click="openLogoUpload">
              <span>+ Logo Ekle</span>
            </div>
            <button v-if="project.logoUrl" @click="removeLogo" class="remove-logo-btn">Logoyu Kaldır</button>
          </div>
          <input 
            ref="logoFileInput"
            type="file" 
            accept="image/*" 
            @change="handleLogoUpload" 
            style="display: none"
          />
        </div>

        <!-- Text Fields -->
        <div class="info-fields">
          <div class="form-group">
            <label for="designerName">Tasarımcı Adı:</label>
            <input id="designerName" type="text" v-model="projectDetails.designerName" @input="saveProjectDetails" placeholder="Opsiyonel">
          </div>
          <div class="form-group">
            <label for="collection">Koleksiyon:</label>
            <input id="collection" type="text" v-model="projectDetails.collection" @input="saveProjectDetails" placeholder="Opsiyonel">
          </div>
          <div class="form-group">
            <label for="phone">Telefon:</label>
            <input id="phone" type="text" v-model="projectDetails.phone" @input="saveProjectDetails" placeholder="Opsiyonel">
          </div>
          <div class="form-group">
            <label for="email">E-posta:</label>
            <input id="email" type="email" v-model="projectDetails.email" @input="saveProjectDetails" placeholder="Opsiyonel">
          </div>
        </div>
      </div>
    </div>

    <div v-if="project.products.length === 0" class="no-products">
      <p>Henüz ürün yok. Başlamak için bir CSV dosyası yükleyin veya yeni ürün ekleyin.</p>
    </div>
    
    <div v-else class="products-container">
       <div v-for="(product, index) in project.products" :key="product.id" > 
          <div class="product-card">
             <div class="product-card-header">
                <div class="move-buttons">
                   <button 
                     @click="store.moveProduct(index, 'up')"
                     :disabled="index === 0"
                     class="move-btn"
                     title="Yukarı Taşı"
                    >↑</button>
                   <button 
                     @click="store.moveProduct(index, 'down')"
                     :disabled="index === project.products.length - 1"
                     class="move-btn"
                     title="Aşağı Taşı"
                    >↓</button>
                </div>
                <button class="delete-product-btn" @click="confirmDeleteProduct(product.id)">×</button>
             </div>
            <div class="product-content-grid">
              <div class="product-info">
                <div class="product-header">
                  <input 
                    type="text" 
                    :value="product.productName" 
                    @change="updateProductField(product, 'productName', $event)" 
                    placeholder="Ürün Adı"
                    class="product-name-input"
                  >
                   <input 
                    type="text" 
                    :value="product.productCode" 
                    @change="updateProductField(product, 'productCode', $event)" 
                    placeholder="Ürün Kodu"
                    class="product-code-input"
                  >
                </div>
                
                <div class="product-details-inputs">
                   <div class="form-group-inline">
                      <label :for="`content-${product.id}`">İçerik:</label>
                      <input :id="`content-${product.id}`" type="text" :value="product.content" @change="updateProductField(product, 'content', $event)">
                   </div>
                   <div class="form-group-inline">
                      <label :for="`size-${product.id}`">Beden:</label>
                      <input :id="`size-${product.id}`" type="text" :value="product.size" @change="updateProductField(product, 'size', $event)">
                   </div>
                   <div class="form-group-inline">
                      <label :for="`price-${product.id}`">Fiyat:</label>
                      <input :id="`price-${product.id}`" type="text" :value="product.price" @change="updateProductField(product, 'price', $event)">
                   </div>
                   <div class="form-group-inline">
                      <label :for="`tax-${product.id}`">KDV:</label>
                      <input :id="`tax-${product.id}`" type="text" :value="product.tax" @change="updateProductField(product, 'tax', $event)">
                   </div>
                </div>
              </div>
              
              <div class="product-images">
                <div 
                  class="image-upload-zone" 
                  @click="openImageUpload(product.id)"
                >
                  <div v-if="product.images.length === 0" class="upload-prompt">
                    <span>+ Resim eklemek için tıklayın</span>
                  </div>
                  <div v-else class="images-grid">
                    <div 
                      v-for="(image, index) in product.images" 
                      :key="index" 
                      class="image-container"
                    >
                      <img :src="image" alt="Ürün resmi" />
                      <button 
                        class="remove-image-btn" 
                        @click.stop="removeImage(product.id, index)"
                      >
                        ×
                      </button>
                    </div>
                    <div class="add-more" @click.stop="openImageUpload(product.id)">
                      <span>+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      @change="handleImageUpload" 
      multiple
      style="display: none"
    >
  </div>
</template>

<style scoped>
.linesheet-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.linesheet-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
  gap: 15px;
}

.back-btn {
  background-color: #f0f0f0;
  color: #333;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

h1 {
  margin: 0;
  flex-grow: 1;
  text-align: center;
}

.actions {
  display: flex;
  gap: 10px;
}

.preview-btn {
  background-color: #2196f3;
}

.preview-btn:disabled {
  background-color: #b0b0b0;
  cursor: not-allowed;
}

.no-products {
  text-align: center;
  margin-top: 50px;
  color: #666;
}

.products-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
  gap: 20px;
}

.product-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #eee;
  position: relative;
  overflow: hidden;
}

.product-card-header {
  background-color: #f8f8f8;
  padding: 5px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.move-buttons {
  display: flex;
  gap: 5px;
}

.move-btn {
  background: #eee;
  border: 1px solid #ddd;
  color: #333;
  font-size: 1em;
  cursor: pointer;
  padding: 2px 8px;
  line-height: 1;
  border-radius: 3px;
}

.move-btn:disabled {
  color: #bbb;
  cursor: not-allowed;
  background: #f5f5f5;
}

.move-btn:hover:not(:disabled) {
  background: #ddd;
}

.delete-product-btn {
  background: none;
  border: none;
  color: #f44336;
  font-size: 1.5em;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
}
.delete-product-btn:hover {
  color: #d32f2f;
}

.product-content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
}

.product-info {
  padding: 15px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-header {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.product-name-input {
  font-size: 1.1em;
  font-weight: bold;
  border: none;
  border-bottom: 1px solid transparent;
  padding: 2px 0;
}
.product-name-input:focus {
  outline: none;
  border-bottom: 1px solid #ccc;
}

.product-code-input {
   font-size: 0.9em;
   color: #666;
   border: none;
   border-bottom: 1px solid transparent;
   padding: 2px 0;
}
.product-code-input:focus {
  outline: none;
  border-bottom: 1px solid #ccc;
}

.product-details-inputs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form-group-inline {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 8px;
  align-items: center;
}

.form-group-inline label {
  font-weight: bold;
  font-size: 0.85em;
  color: #555;
  text-align: right;
}

.form-group-inline input {
  padding: 5px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9em;
  width: 100%;
}

.product-images {
  margin-top: 0;
  padding: 15px;
}

.image-upload-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.image-upload-zone:hover {
  background-color: #f9f9f9;
}

.upload-prompt {
  color: #666;
  font-size: 16px;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  width: 100%;
  padding: 10px;
}

.image-container {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
}

.add-more {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  aspect-ratio: 1;
  font-size: 24px;
}

/* Project Details Card Styles */
.project-details-card {
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.project-details-card h2 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.4em;
  color: #333;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 2fr; /* Adjust ratio as needed */
  gap: 30px;
  align-items: start;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.logo-upload-area {
  width: 180px;
  height: 120px;
  border: 2px dashed #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden; /* To contain the image */
  position: relative; /* For remove button positioning if needed */
  background-color: #fff;
}

.logo-upload-area:hover {
  border-color: #aaa;
}

.logo-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.logo-placeholder span {
  color: #666;
}

.remove-logo-btn {
  margin-top: 5px;
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  font-size: 0.8em;
  border-radius: 4px;
  cursor: pointer;
}

.remove-logo-btn:hover {
  background-color: #d32f2f;
}

.info-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px 20px; /* Row gap and column gap */
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 0.9em;
  color: #555;
}

.form-group input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
}

/* Responsive adjustments for details card */
@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr; /* Stack columns */
  }
  .info-fields {
    grid-template-columns: 1fr; /* Stack fields */
  }
  .logo-upload-area {
     width: 150px;
     height: 100px;
  }
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  border-left: 4px solid #c62828;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>
