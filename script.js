document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    // logoElement는 이제 <img> 태그입니다.
    const logoElement = document.getElementById('logo'); 
    
    const introToggler = document.querySelector('[data-node-id="소개"]');
    const issue1Toggler = document.querySelector('[data-node-id="1호"]');
    
    // 모달 관련 요소
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalBody = document.getElementById('modal-article-body');

    // ---------------------------------------------
    // 1. 글 목록 동적 생성
    // ---------------------------------------------
    // articleData는 별도의 articles.js 파일에 있다고 가정합니다.
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    // 소개글 노드 생성
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

    // 1호 글 목록 노드 생성
    issue1Articles.forEach(articleId => {
        const article = articleData[articleId];
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('article-item');
        itemDiv.dataset.articleId = articleId; 
        
        const authorNode = document.createElement('div');
        authorNode.classList.add('node', 'author-node');
        authorNode.dataset.nodeId = article.author;
        authorNode.textContent = article.author;
        
        const titleNode = document.createElement('div');
        titleNode.classList.add('node', 'title-node', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.textContent = article.title;
        
        itemDiv.appendChild(authorNode);
        itemDiv.appendChild(titleNode);
        articlesListDiv.appendChild(itemDiv);
    });

   // ... (script.js 파일 내부의 drawConnections 함수 및 이벤트 리스너 수정)

// ... (생략) ...

// ---------------------------------------------
// 2. SVG 연결선 그리기 함수
// ---------------------------------------------
    const drawConnections = () => {
        // ... (Connections 정의 부분 유지) ...

        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            let x, y;
            
            // ★노드의 위치에 sidebar의 스크롤 위치를 더하여 절대 좌표 계산★
            const scrollY = sidebar.scrollTop; 

            if (nodeId === 'logo') { 
                // 로고 중앙 하단에서 선 시작
                x = rect.left + rect.width / 2 + window.scrollX;
                y = rect.top + rect.height + scrollY; // rect.bottom 대신 rect.top + rect.height 사용 + scrollY
            } else {
                // 일반 노드 오른쪽 중앙에서 선 시작
                x = rect.left + rect.width + window.scrollX;
                y = rect.top + rect.height / 2 + scrollY; // rect.top + rect.height / 2 사용 + scrollY
            }
            
            return { x, y };
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const startX = parentPos.x; 
                const startY = parentPos.y;
                // 끝점: 자식 노드의 왼쪽 끝
                const endX = childPos.x - (childNode ? childNode.offsetWidth : 0); 
                const endY = childPos.y;

                // ★SVG 좌표는 뷰포트 기준이므로 스크롤 보정값을 준다.★
                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - sidebar.scrollTop; 
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - sidebar.scrollTop; 
                
                // ... (나머지 선 그리기 로직 유지) ...
                
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 10} ${svgStartY + 10}, ${svgEndX - 10} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else if (conn.type === 'straight') {
                    const midX = svgStartX + distanceX * 0.5;
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} L ${midX} ${svgStartY} L ${midX} ${svgEndY} L ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 40} ${svgStartY}, ${svgEndX - 40} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    const distanceX = svgEndX - svgStartX; // SVG 좌표 기준으로 다시 계산
                    const distanceY = svgEndY - svgStartY;
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화
    // ---------------------------------------------
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        
        if (node) {
            if (node.classList.contains('article-link')) {
                // 글 클릭 시 모달 표시
                showArticleModal(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                // 토글러 (소개/1호) 클릭 시
                // 모달을 닫고
                closeModal();
                // 목록을 토글
                toggleArticlesList(node);
            }
        }
    });

    // 로고 클릭 이벤트 (★PNG 이미지 클릭 가능★)
    logoElement.addEventListener('click', () => {
        closeModal(); 
        // 로고 클릭 시 모든 목록 닫기
        document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
        setTimeout(drawConnections, 400);
    });

    // 모달 닫기 이벤트
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections);

    // 초기 로드 시: 하위 메뉴 숨기기
    document.querySelectorAll('.menu-children').forEach(list => {
        list.classList.remove('expanded');
    });
    
    // 초기 로드 시 선 그리기
    setTimeout(drawConnections, 10);
});

