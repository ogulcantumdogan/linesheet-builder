<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLineSheetStore } from '../stores/linesheet'
import LoadingIndicator from '../components/LoadingIndicator.vue'

const store = useLineSheetStore()
const router = useRouter()
const newProjectName = ref('')
const errorMessage = ref('')

onMounted(async () => {
  await store.loadProjects()
})

async function createProject() {
  if (!newProjectName.value.trim()) return
  
  errorMessage.value = ''
  const id = await store.createProject(newProjectName.value.trim())
  
  if (id) {
    newProjectName.value = ''
    router.push(`/linesheet/${id}`)
  } else {
    errorMessage.value = 'Failed to create project. Please try again.'
  }
}

async function openProject(id: string) {
  await store.loadProject(id)
  router.push(`/linesheet/${id}`)
}

async function deleteProject(id: string, event: Event) {
  event.stopPropagation()
  if (confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
    await store.deleteProject(id)
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="home-container">
    <LoadingIndicator :show="store.isLoading" message="Please wait..." />
    
    <h1>Koleksiyon Föy Oluşturucu</h1>
    
    <div v-if="store.error || errorMessage" class="error-message">
      {{ store.error || errorMessage }}
    </div>
    
    <div class="create-project">
      <h2>Yeni Proje Oluştur</h2>
      <div class="input-group">
        <input 
          v-model="newProjectName" 
          type="text" 
          placeholder="Proje adını girin"
          @keyup.enter="createProject"
        >
        <button @click="createProject" :disabled="store.isLoading">Oluştur</button>
      </div>
    </div>
    
    <div class="existing-projects">
      <h2>Projeleriniz</h2>
      <div v-if="store.projects.length === 0" class="no-projects">
        Henüz proje yok. Başlamak için bir proje oluşturun!
      </div>
      <div v-else class="projects-list">
        <div 
          v-for="project in store.projects" 
          :key="project.id" 
          class="project-card"
          @click="openProject(project.id)"
        >
          <div class="project-info">
            <h3>{{ project.name }}</h3>
            <p>Oluşturma: {{ formatDate(project.createdAt) }}</p>
            <p>Ürün sayısı: {{ project.products.length }}</p>
          </div>
          <div class="project-actions">
            <button 
              class="delete-btn" 
              @click="deleteProject(project.id, $event)" 
              :disabled="store.isLoading"
            >
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}

.create-project {
  background-color: #f7f7f7;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.input-group {
  display: flex;
  gap: 10px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #45a049;
}

.projects-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.project-card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  justify-content: space-between;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.delete-btn {
  background-color: #f44336;
  padding: 8px 15px;
  font-size: 14px;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.no-projects {
  text-align: center;
  color: #666;
  margin-top: 20px;
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
