// ... (script.js 내용 유지)

// ---------------------------------------------
// 4. 이벤트 리스너 및 초기화
// ---------------------------------------------
sidebar.addEventListener('click', (event) => {
    // ... (이전 로직 유지) ...
});

// 로고 클릭 이벤트 (★문제 1 해결★)
logoElement.addEventListener('click', () => {
    closeModal(); 
    document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
    setTimeout(drawConnections, 400);
});

// ... (나머지 이벤트 리스너 유지) ...
