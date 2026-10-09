import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import 'antd/dist/reset.css'

import App from '@/App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('未找到 id="root" 的挂载节点，请检查 index.html')
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
