import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'
import FillView from '../views/FillView.vue'
import ResponsesView from '../views/ResponsesView.vue'
import AllAtOnceView from '../views/AllAtOnceView.vue'
import PublicFillView from '../views/PublicFillView.vue'
import DemoSurveyView from '../views/DemoSurveyView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: EditorView
    },
    {
      path: '/fill/:id',
      name: 'fill',
      component: FillView
    },
    {
      path: '/fill/:id/all',
      name: 'fill-all',
      component: AllAtOnceView
    },
    {
      path: '/s/:hash',
      name: 'public-fill',
      component: PublicFillView
    },
    {
      path: '/demo',
      name: 'demo-survey',
      component: DemoSurveyView
    },
    {
      path: '/responses/:id',
      name: 'responses',
      component: ResponsesView
    }
  ],
})

export default router