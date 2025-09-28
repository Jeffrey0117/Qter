<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-800 mb-4">
          📋 QTER 問卷系統測試頁面
        </h1>
        <p class="text-lg text-gray-600">
          快速建立並測試各種問卷功能
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8">
        <!-- 測試問卷卡片 -->
        <div class="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">
              🚀 快速測試問卷
            </h2>
            <p class="text-gray-600">
              包含所有題型的完整測試問卷
            </p>
          </div>
          
          <div class="space-y-4 mb-6">
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              10 種不同題型
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              單題/全頁顯示模式
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              進度條與自動跳題
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <svg class="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
              </svg>
              自訂樣式與動畫
            </div>
          </div>

          <button 
            @click="createTestSurvey"
            :disabled="creating"
            class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="!creating">建立測試問卷 →</span>
            <span v-else>建立中...</span>
          </button>
        </div>

        <!-- 其他測試選項 -->
        <div class="bg-white rounded-xl shadow-lg p-8">
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-2">
              🎯 其他測試選項
            </h2>
            <p class="text-gray-600">
              特定功能測試
            </p>
          </div>

          <div class="space-y-4">
            <button @click="createMinimalSurvey" class="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 class="font-semibold text-gray-800">最小測試問卷</h3>
              <p class="text-sm text-gray-600 mt-1">僅包含必要題目的簡單問卷</p>
            </button>
            
            <button @click="createStyledSurvey" class="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 class="font-semibold text-gray-800">客製化樣式問卷</h3>
              <p class="text-sm text-gray-600 mt-1">測試進階樣式與動畫效果</p>
            </button>
            
            <button @click="createValidationSurvey" class="w-full text-left p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <h3 class="font-semibold text-gray-800">驗證規則測試</h3>
              <p class="text-sm text-gray-600 mt-1">測試各種驗證規則與錯誤提示</p>
            </button>
          </div>
        </div>
      </div>

      <!-- 已建立的測試問卷列表 -->
      <div v-if="recentSurveys.length > 0" class="mt-12">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">最近建立的測試問卷</h2>
        <div class="bg-white rounded-xl shadow-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 border-b">
              <tr>
                <th class="text-left px-6 py-3 text-sm font-semibold text-gray-700">標題</th>
                <th class="text-left px-6 py-3 text-sm font-semibold text-gray-700">題數</th>
                <th class="text-left px-6 py-3 text-sm font-semibold text-gray-700">建立時間</th>
                <th class="text-right px-6 py-3 text-sm font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="survey in recentSurveys" :key="survey.id" class="hover:bg-gray-50">
                <td class="px-6 py-4">{{ survey.title }}</td>
                <td class="px-6 py-4">{{ survey.questionCount }} 題</td>
                <td class="px-6 py-4">{{ formatTime(survey.createdAt) }}</td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="goToFill(survey.id)"
                    class="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    填寫 →
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'

const router = useRouter()
const creating = ref(false)
const recentSurveys = ref([])

// 建立完整測試問卷
const createTestSurvey = async () => {
  creating.value = true
  try {
    const formData = {
      title: '📋 QTER 系統完整功能測試問卷',
      description: '這是一份包含所有題型的測試問卷，用於展示系統的完整功能',
      settings: {
        allowAnonymous: true,
        showProgressBar: true,
        enableAutoSave: true,
        displayMode: 'step_by_step',
        autoAdvance: true,
        allowBackNavigation: true,
        customStyles: `
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .question-card {
            animation: fadeIn 0.3s ease-out;
            border-left: 4px solid #3B82F6;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          }
          .submit-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transform: scale(1);
            transition: all 0.3s;
          }
          .submit-button:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          }
        `
      },
      questions: [
        {
          type: 'short_answer',
          title: '1. 請輸入您的姓名',
          description: '這是簡答題範例（必填）',
          isRequired: true,
          validation: {
            minLength: 2,
            maxLength: 50
          },
          orderIndex: 1
        },
        {
          type: 'long_answer',
          title: '2. 請描述您使用問卷系統的經驗',
          description: '這是長文本題範例，可以輸入多行文字',
          isRequired: false,
          validation: {
            maxLength: 500
          },
          orderIndex: 2
        },
        {
          type: 'single_choice',
          title: '3. 您最喜歡哪個季節？',
          description: '這是單選題範例',
          options: ['春天 🌸', '夏天 ☀️', '秋天 🍁', '冬天 ❄️'],
          isRequired: true,
          orderIndex: 3
        },
        {
          type: 'multiple_choice',
          title: '4. 您常使用的程式語言有哪些？',
          description: '這是多選題範例（可選擇多個）',
          options: ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'TypeScript', 'PHP'],
          isRequired: false,
          orderIndex: 4
        },
        {
          type: 'rating',
          title: '5. 請為本系統評分',
          description: '這是評分題範例（1-5 星）',
          validation: {
            min: 1,
            max: 5
          },
          isRequired: true,
          orderIndex: 5
        },
        {
          type: 'date',
          title: '6. 請選擇您的出生日期',
          description: '這是日期選擇題範例',
          isRequired: false,
          orderIndex: 6
        },
        {
          type: 'email',
          title: '7. 請輸入您的電子郵件',
          description: '這是電子郵件題範例（會驗證格式）',
          isRequired: true,
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
          },
          orderIndex: 7
        },
        {
          type: 'number',
          title: '8. 請輸入您的年齡',
          description: '這是數字題範例',
          validation: {
            min: 1,
            max: 150
          },
          isRequired: false,
          orderIndex: 8
        },
        {
          type: 'file_upload',
          title: '9. 請上傳您的簡歷',
          description: '這是檔案上傳題範例（支援 PDF、DOC）',
          validation: {
            maxFileSize: 5,
            allowedFileTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
          },
          isRequired: false,
          orderIndex: 9
        },
        {
          type: 'matrix',
          title: '10. 請評價以下服務',
          description: '這是矩陣題範例',
          matrixRows: ['使用介面', '功能完整性', '效能表現', '客戶支援'],
          matrixColumns: ['非常不滿意', '不滿意', '普通', '滿意', '非常滿意'],
          isRequired: false,
          orderIndex: 10
        }
      ]
    }

    const response = await api.form.createForm(formData)
    const formId = response.data?.data?.id || response.data?.id
    
    // 更新最近建立列表
    recentSurveys.value.unshift({
      id: formId,
      title: formData.title,
      questionCount: formData.questions.length,
      createdAt: new Date()
    })
    
    // 導向填寫頁面
    router.push(`/fill/${formId}`)
  } catch (error) {
    console.error('建立問卷失敗:', error)
    alert('建立問卷失敗，請稍後再試')
  } finally {
    creating.value = false
  }
}

// 建立最小測試問卷
const createMinimalSurvey = async () => {
  creating.value = true
  try {
    const formData = {
      title: '🎯 最小測試問卷',
      description: '僅包含基本題目的簡單問卷',
      settings: {
        allowAnonymous: true,
        displayMode: 'all_at_once'
      },
      questions: [
        {
          type: 'short_answer',
          title: '您的姓名',
          isRequired: true,
          orderIndex: 1
        },
        {
          type: 'single_choice',
          title: '您的性別',
          options: ['男', '女', '其他'],
          isRequired: true,
          orderIndex: 2
        },
        {
          type: 'long_answer',
          title: '您的建議',
          isRequired: false,
          orderIndex: 3
        }
      ]
    }

    const response = await api.form.createForm(formData)
    const formId = response.data?.data?.id || response.data?.id
    router.push(`/fill/${formId}`)
  } catch (error) {
    console.error('建立問卷失敗:', error)
    alert('建立問卷失敗，請稍後再試')
  } finally {
    creating.value = false
  }
}

// 建立客製化樣式問卷
const createStyledSurvey = async () => {
  creating.value = true
  try {
    const formData = {
      title: '✨ 客製化樣式展示問卷',
      description: '展示進階樣式與動畫效果',
      settings: {
        allowAnonymous: true,
        showProgressBar: true,
        displayMode: 'step_by_step',
        autoAdvance: true,
        customStyles: `
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;700&display=swap');
          
          * {
            font-family: 'Noto Sans TC', sans-serif;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-30px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          .form-container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem;
            border-radius: 20px;
          }
          
          .question-card {
            animation: slideIn 0.5s ease-out;
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            border-left: 5px solid #667eea;
          }
          
          .question-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 1rem;
          }
          
          .option-label {
            padding: 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            margin: 0.5rem 0;
            cursor: pointer;
            transition: all 0.3s;
          }
          
          .option-label:hover {
            background: #f7fafc;
            border-color: #667eea;
            transform: translateX(5px);
          }
          
          .submit-button {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            font-weight: 700;
            padding: 1rem 3rem;
            border-radius: 50px;
            border: none;
            cursor: pointer;
            animation: pulse 2s infinite;
            box-shadow: 0 10px 30px rgba(245, 87, 108, 0.3);
          }
          
          .progress-bar {
            height: 8px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
          }
        `
      },
      questions: [
        {
          type: 'short_answer',
          title: '✨ 歡迎來到客製化問卷',
          description: '請輸入您的暱稱開始體驗',
          isRequired: true,
          orderIndex: 1
        },
        {
          type: 'single_choice',
          title: '🎨 選擇您喜歡的顏色主題',
          options: ['🌈 彩虹漸層', '🌊 海洋藍', '🌸 櫻花粉', '🍃 森林綠', '🌙 星空紫'],
          isRequired: true,
          orderIndex: 2
        },
        {
          type: 'rating',
          title: '⭐ 您覺得這個設計如何？',
          description: '給我們一個評分吧',
          validation: {
            min: 1,
            max: 5
          },
          isRequired: true,
          orderIndex: 3
        }
      ]
    }

    const response = await api.form.createForm(formData)
    const formId = response.data?.data?.id || response.data?.id
    router.push(`/fill/${formId}`)
  } catch (error) {
    console.error('建立問卷失敗:', error)
    alert('建立問卷失敗，請稍後再試')
  } finally {
    creating.value = false
  }
}

// 建立驗證規則測試問卷
const createValidationSurvey = async () => {
  creating.value = true
  try {
    const formData = {
      title: '🔍 驗證規則測試問卷',
      description: '測試各種輸入驗證與錯誤提示',
      settings: {
        allowAnonymous: true,
        showProgressBar: true,
        displayMode: 'all_at_once'
      },
      questions: [
        {
          type: 'short_answer',
          title: '使用者名稱（3-10字元）',
          description: '測試長度驗證',
          isRequired: true,
          validation: {
            minLength: 3,
            maxLength: 10
          },
          orderIndex: 1
        },
        {
          type: 'email',
          title: '電子郵件地址',
          description: '測試郵件格式驗證',
          isRequired: true,
          validation: {
            pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
          },
          orderIndex: 2
        },
        {
          type: 'number',
          title: '年齡（18-100）',
          description: '測試數字範圍驗證',
          isRequired: true,
          validation: {
            min: 18,
            max: 100
          },
          orderIndex: 3
        },
        {
          type: 'file_upload',
          title: '上傳圖片（最大 2MB，僅限 JPG/PNG）',
          description: '測試檔案類型與大小驗證',
          validation: {
            maxFileSize: 2,
            allowedFileTypes: ['image/jpeg', 'image/png']
          },
          isRequired: true,
          orderIndex: 4
        },
        {
          type: 'long_answer',
          title: '自我介紹（至少 50 字）',
          description: '測試最小長度驗證',
          isRequired: true,
          validation: {
            minLength: 50,
            maxLength: 500
          },
          orderIndex: 5
        }
      ]
    }

    const response = await api.form.createForm(formData)
    const formId = response.data?.data?.id || response.data?.id
    router.push(`/fill/${formId}`)
  } catch (error) {
    console.error('建立問卷失敗:', error)
    alert('建立問卷失敗，請稍後再試')
  } finally {
    creating.value = false
  }
}

// 導向填寫頁面
const goToFill = (formId) => {
  router.push(`/fill/${formId}`)
}

// 格式化時間
const formatTime = (date) => {
  return new Date(date).toLocaleString('zh-TW')
}
</script>