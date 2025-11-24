import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EditorView from '../views/EditorView.vue'
import FillView from '../views/FillView.vue'
import ResponsesView from '../views/ResponsesView.vue'
import AllAtOnceView from '../views/AllAtOnceView.vue'
import PublicFillView from '../views/PublicFillView.vue'
import DemoSurveyView from '../views/DemoSurveyView.vue'
import LoginView from '../views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/editor/:id',
      name: 'editor',
      component: EditorView,
      meta: { requiresAuth: true }
    },
    {
      path: '/fill/:id',
      name: 'fill',
      component: FillView,
      meta: { requiresAuth: false }
    },
    {
      path: '/fill/:id/all',
      name: 'fill-all',
      component: AllAtOnceView,
      meta: { requiresAuth: false }
    },
    {
      path: '/s/:hash',
      name: 'public-fill',
      component: PublicFillView,
      meta: { requiresAuth: false }
    },
    {
      path: '/demo',
      name: 'demo-survey',
      component: DemoSurveyView,
      meta: { requiresAuth: false }
    },
    {
      path: '/responses/:id',
      name: 'responses',
      component: ResponsesView,
      meta: { requiresAuth: true }
    }
  ],
})

 // 路由守衛 - 檢查認證狀態
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  authStore.checkAuth()

  // 🔧 開發模式：繞過登入檢查（僅限 localhost）
  const isDevMode = import.meta.env.DEV && window.location.hostname === 'localhost'

  if (isDevMode && to.meta.requiresAuth) {
    console.log('🔧 [Dev Mode] Bypassing auth check for:', to.path)
    next()
    return
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 需要登入但未登入，導向登入頁
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // 已登入但訪問登入頁，導向儀表板
    next('/dashboard')
  } else if (to.path === '/' && authStore.isAuthenticated) {
    // 已登入訪問首頁時，導向儀表板
    next('/dashboard')
  } else {
    next()
  }
})

export default router