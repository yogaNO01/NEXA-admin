import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import 'antd/dist/reset.css';
import App from './App.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ConfigProvider theme={{ token: { colorPrimary: '#187d62', borderRadius: 8, controlHeight: 42, fontFamily: 'Inter, PingFang SC, Microsoft YaHei, sans-serif' } }}>
      <App />
    </ConfigProvider>
  </StrictMode>,
);
