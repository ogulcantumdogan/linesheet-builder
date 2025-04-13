import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LineSheetView from '../views/LineSheetView.vue'
import PreviewView from '../views/PreviewView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/linesheet/:id',
      name: 'linesheet',
      component: LineSheetView,
      props: true,
    },
    {
      path: '/preview/:id',
      name: 'preview',
      component: PreviewView,
      props: true,
    },
  ],
})

export default router
