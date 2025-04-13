<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLineSheetStore } from '../stores/linesheet'

const props = defineProps<{
  id: string
}>()

const store = useLineSheetStore()
const router = useRouter()
const lineSheetRef = ref<HTMLElement | null>(null)

onMounted(() => {
  store.loadProject(props.id)
  if (!store.currentProject) {
    router.push('/')
  }
})

const project = computed(() => store.currentProject)

function goBack() {
  router.push(`/linesheet/${props.id}`)
}

function printLineSheet() {
  window.print()
}

function hasImages(product: any) {
  return product.images && product.images.length > 0
}
</script>

<template>
  <div class="preview-container">
    <div class="action-header no-print">
      <button class="back-btn" @click="goBack">← Düzenleyiciye Dön</button>
      <h1>{{ project?.name }} - Önizleme</h1>
      <div class="actions">
        <button @click="printLineSheet">PDF Olarak Kaydet / Yazdır</button>
      </div>
    </div>

    <div ref="lineSheetRef" class="linesheet-preview">
      <div class="linesheet-header">
        <div class="logo-container">
          <!-- Display logo if URL exists -->
          <img v-if="project?.logoUrl" :src="project.logoUrl" alt="Company Logo" class="company-logo">
          <div v-else class="logo-placeholder">
            <span>Logo Placeholder</span>
          </div>
        </div>
        <div class="season-info">
           <!-- Display project name as season/collection title -->
           {{ project?.name }}
        </div>
        <div class="designer-info">
          <!-- Conditionally render designer details -->
          <div v-if="project?.designerName">{{ project.designerName }}</div>
          <div v-if="project?.collection">COLLECTION: {{ project.collection }}</div>
          <div v-if="project?.phone">PHONE: {{ project.phone }}</div>
          <div v-if="project?.email">E-MAIL: {{ project.email }}</div>
        </div>
      </div>

      <div class="linesheet-content">
        <div class="products-grid">
          <div 
            v-for="product in project?.products" 
            :key="product.id" 
            class="product-item"
          >
            <div class="product-images">
               <img 
                  v-for="(image, index) in product.images?.slice(0, 2)" 
                  :key="index" 
                  :src="image" 
                  :alt="`${product.productName} image ${index + 1}`" 
                  :class="{'single-image': product.images?.length === 1}"
               />
               <!-- Add placeholder if no images -->
               <div v-if="!product.images || product.images.length === 0" class="image-placeholder">No Image</div>
            </div>
            <div class="product-details">
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">{{ product.productName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Code:</span>
                <span class="value">{{ product.productCode }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Materials:</span>
                <span class="value">{{ product.content }}</span> 
              </div>
               <div class="detail-row">
                <span class="label">Price:</span>
                <span class="value">{{ product.price }}</span> <!-- Assuming product.price is wholesale -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* General Reset & Base */
* {
  box-sizing: border-box;
}

body {
  font-family: sans-serif;
  margin: 0;
  background-color: #f8f8f8; /* Light background for contrast */
}

.preview-container {
  max-width: 1100px; /* A bit wider for 3 columns */
  margin: 20px auto;
  padding: 0 20px;
}

/* Non-printing Header */
.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 10px;
  background-color: #eee;
  border-radius: 4px;
}

.action-header h1 {
  margin: 0;
  font-size: 1.2em;
}

.back-btn, .action-header button {
  background-color: #ddd;
  color: #333;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.back-btn:hover, .action-header button:hover {
   background-color: #ccc;
}

/* Linesheet Preview Area */
.linesheet-preview {
  background-color: white;
  padding: 25px;
  border: 1px solid #ccc;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* Linesheet Header (Logo, Season, Designer) */
.linesheet-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 25px;
}

/* Updated Logo container styles */
.logo-container {
  border: 1px solid #ccc;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70px; /* Adjust as needed */
  min-width: 160px; /* Adjust as needed */
  max-width: 200px; /* Max width for logo */
  background-color: #fff; /* Ensure background for image */
}

.company-logo {
  max-width: 100%;
  max-height: 60px; /* Max height for logo image */
  object-fit: contain;
}

/* Keep placeholder styles if needed when no logo */
.logo-placeholder {
  color: #aaa;
  font-size: 0.9em;
  text-align: center;
}

.season-info {
  text-align: center;
  padding-top: 10px;
}

.designer-info {
  font-size: 0.85em;
  text-align: right;
  line-height: 1.4;
}

.designer-info div {
  white-space: nowrap;
}

/* Products Grid */
.linesheet-content {
  margin-top: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
}

/* Individual Product Item */
.product-item {
  border: 1px solid #ccc;
  background-color: #fff;
  page-break-inside: avoid;
  display: flex;
  flex-direction: column;
}

.product-images {
  display: flex; /* Use flex for side-by-side images */
  justify-content: center; /* Center images horizontally */
  align-items: center; /* Center images vertically */
  gap: 5px; /* Space between images if two */
  padding: 10px;
  min-height: 180px; /* Ensure consistent height for image area */
  background-color: #f9f9f9; /* Slight background for image area */
}

.product-images img {
  display: block;
  max-width: 50%; /* Max 50% width if two images */
  max-height: 160px; /* Max height for images */
  height: auto;
  object-fit: contain;
}

.product-images img.single-image {
  max-width: 70%; /* Allow single image to be larger */
}

.image-placeholder {
  color: #aaa;
  font-size: 0.9em;
}

/* Product Details Table */
.product-details {
  padding: 0; /* Remove padding, rely on row padding */
  flex-grow: 1; /* Allow details to fill remaining space */
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  border-top: 1px solid #eee; 
  padding: 6px 10px; /* Padding within each row */
  font-size: 0.85em;
}

.detail-row:last-child {
   border-bottom: none; /* No bottom border on last row */
}

.label {
  font-weight: bold;
  width: 100px; /* Fixed width for labels */
  flex-shrink: 0; /* Prevent label from shrinking */
  padding-right: 10px;
  color: #555;
}

.value {
  flex-grow: 1; /* Allow value to take remaining space */
  word-wrap: break-word; /* Wrap long values */
}

.notes-row {
  min-height: 40px; /* Ensure notes row has some minimum height */
  flex-grow: 1; /* Allow notes row to expand */
}

/* Print Styles */
@media print {
  body {
    margin: 0;
    padding: 0;
    background-color: white;
  }
  
  .no-print {
    display: none;
  }

  .preview-container {
    max-width: 100%;
    margin: 0;
    padding: 0;
  }

  .linesheet-preview {
    border: none;
    box-shadow: none;
    padding: 15mm; /* Standard print margin */
    width: 100%; 
    height: 100%;
  }
  
  .linesheet-header {
      padding-bottom: 10px;
      margin-bottom: 15px;
  }

  .products-grid {
    grid-template-columns: repeat(3, 1fr); /* Maintain 3 columns */
    gap: 15px; /* Slightly reduce gap for print */
  }

  .product-item {
    border: 1px solid #aaa; /* Keep border for print */
    font-size: 9pt; /* Slightly smaller font for print */
  }

  .product-images {
      min-height: 150px; /* Slightly reduce min-height */
      padding: 5px;
  }

  .product-images img {
      max-height: 140px; /* Slightly reduce max-height */
  }

  .detail-row {
    padding: 4px 8px; /* Slightly reduce padding */
    font-size: 8pt;
  }
  
  .label {
      width: 80px; /* Reduce label width */
  }
}

/* Responsive Adjustments (Optional - Example) */
@media (max-width: 992px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr); /* 2 columns on medium screens */
  }
  .linesheet-header {
      flex-direction: column;
      align-items: center;
      gap: 15px;
  }
  .designer-info {
      text-align: center;
  }
}

@media (max-width: 600px) {
  .products-grid {
    grid-template-columns: 1fr; /* 1 column on small screens */
  }
}

</style>
