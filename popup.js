// Функция для извлечения домена из URL
function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}

// Функция для поиска дубликатов
async function findDuplicates() {
  const tabs = await chrome.tabs.query({});
  const urlMap = new Map();

  // Группируем вкладки по URL
  tabs.forEach(tab => {
    if (!urlMap.has(tab.url)) {
      urlMap.set(tab.url, []);
    }
    urlMap.get(tab.url).push(tab);
  });

  // Находим только те URL, которые имеют дубликаты
  const duplicates = Array.from(urlMap.entries())
    .filter(([url, tabs]) => tabs.length > 1);

  // Сортируем по домену, затем по URL
  duplicates.sort((a, b) => {
    const urlA = a[0];
    const urlB = b[0];
    const domainA = getDomain(urlA);
    const domainB = getDomain(urlB);

    if (domainA !== domainB) {
      return domainA.localeCompare(domainB);
    }
    return urlA.localeCompare(urlB);
  });

  return duplicates;
}

// Функция для отображения дубликатов
async function displayDuplicates() {
  const duplicates = await findDuplicates();
  const listContainer = document.getElementById('duplicatesList');
  const noDuplicatesDiv = document.getElementById('noDuplicates');

  // Получаем текущую активную вкладку
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (duplicates.length === 0) {
    listContainer.style.display = 'none';
    noDuplicatesDiv.style.display = 'block';
    return;
  }

  listContainer.innerHTML = '';

  let currentDomain = null;
  let currentDomainContainer = null;

  duplicates.forEach(([url, tabs]) => {
    const domain = getDomain(url);

    if (domain !== currentDomain) {
      currentDomain = domain;

      currentDomainContainer = document.createElement('div');
      currentDomainContainer.className = 'domain-group-container';

      const domainHeader = document.createElement('div');
      domainHeader.className = 'domain-header';
      domainHeader.textContent = domain;
      currentDomainContainer.appendChild(domainHeader);

      listContainer.appendChild(currentDomainContainer);
    }

    const groupDiv = document.createElement('div');
    groupDiv.className = 'duplicate-group';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'group-header';
    // Показываем заголовок первой вкладки как название группы страниц
    const pageTitle = tabs[0].title || 'Без названия';
    headerDiv.textContent = `${pageTitle} (${tabs.length})`;
    groupDiv.appendChild(headerDiv);

    tabs.forEach(tab => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'duplicate-item tooltip';

      // Подсвечиваем активную вкладку
      if (activeTab && tab.id === activeTab.id) {
        itemDiv.classList.add('active-tab');
      }

      // Кнопка закрыть
      const closeBtn = document.createElement('button');
      closeBtn.className = 'close-btn';
      closeBtn.textContent = 'Закрыть';
      closeBtn.onclick = async () => {
        await chrome.tabs.remove(tab.id);
        displayDuplicates(); // Обновляем список
      };

      // Иконка сайта
      const favicon = document.createElement('img');
      favicon.className = 'favicon';
      favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23ddd"/></svg>';
      favicon.onerror = function () {
        this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23ddd"/></svg>';
      };

      // Информация о вкладке
      const infoDiv = document.createElement('div');
      infoDiv.className = 'tab-info';
      infoDiv.style.cursor = 'pointer';
      infoDiv.onclick = async () => {
        await chrome.tabs.update(tab.id, { active: true });
        await chrome.windows.update(tab.windowId, { focused: true });
        window.close();
      };

      const titleDiv = document.createElement('div');
      titleDiv.className = 'title';
      titleDiv.textContent = tab.title || 'Без названия';

      infoDiv.appendChild(titleDiv);

      // Всплывающая подсказка с полным URL
      const tooltip = document.createElement('span');
      tooltip.className = 'tooltiptext';
      tooltip.textContent = tab.url;

      itemDiv.appendChild(closeBtn);
      itemDiv.appendChild(favicon);
      itemDiv.appendChild(infoDiv);
      itemDiv.appendChild(tooltip);

      groupDiv.appendChild(itemDiv);
    });

    currentDomainContainer.appendChild(groupDiv);
  });
}

// Загружаем дубликаты при открытии popup
displayDuplicates();