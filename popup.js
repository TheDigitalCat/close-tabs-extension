document.getElementById('closeBtn').addEventListener('click', async () => {
  const urlPattern = document.getElementById('urlInput').value.trim();
  const statusDiv = document.getElementById('status');
  
  if (!urlPattern) {
    showStatus('Пожалуйста, введите URL', 'error');
    return;
  }
  
  try {
    // Получаем все вкладки
    const tabs = await chrome.tabs.query({});
    
    // Фильтруем вкладки по точному совпадению URL
    const tabsToClose = tabs.filter(tab => tab.url === urlPattern);
    
    if (tabsToClose.length === 0) {
      showStatus('Вкладки с таким URL не найдены', 'error');
      return;
    }
    
    // Закрываем найденные вкладки
    const tabIds = tabsToClose.map(tab => tab.id);
    await chrome.tabs.remove(tabIds);
    
    showStatus(`Закрыто вкладок: ${tabsToClose.length}`, 'success');
    
    // Закрываем popup через 1.5 секунды
    setTimeout(() => {
      window.close();
    }, 1500);
    
  } catch (error) {
    showStatus('Ошибка: ' + error.message, 'error');
  }
});

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = type;
  statusDiv.style.display = 'block';
}

// Обработка Enter
document.getElementById('urlInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('closeBtn').click();
  }
});