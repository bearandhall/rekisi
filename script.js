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
    // (이 부분은 이전과 동일하게 유지됩니다.)
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

    // ---------------------------------------------
    // 2. SVG 연결선 그리기 함수
    // ---------------------------------------------
    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [
            { parent: 'logo', child: '소개', startType: 'bottom-center' },
            { parent: 'logo', child: '1호', startType: 'bottom-center' },
        ];

        const introChildren = document.querySelector('#intro-section .menu-children');
        if (introChildren.classList.contains('expanded')) {
            connections.push({ parent: '소개', child: '소개글' });
        }

        const articlesContainer = document.querySelector('#issue-1-section .menu-children');
        
        if (articlesContainer.classList.contains('expanded')) {
             issue1Articles.forEach(articleId => {
                 const article = articleData[articleId];
                 
                 // 1호 -> 저자 연결
                 connections.push({ parent: '1호', child: article.author });
                 // 저자 -> 제목 연결
                 connections.push({ parent: article.author, child: article.title, type: 'straight' });
             });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            let x, y;
            
            if (nodeId === 'logo') { 
                // 로고 중앙 하단에서 선 시작
                x = rect.left + rect.width / 2 + window.scrollX; // 중앙 X
                y = rect.bottom + window.scrollY; // 하단 Y
            } else {
                // 일반 노드 오른쪽 중앙에서 선 시작
                x = rect.left + rect.width + window.scrollX;
                y = rect.top + rect.height / 2 + window.scrollY;
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

                const distanceX = endX - startX;
                const distanceY = endY - startY;

                const svgStartX = startX - window.scrollX;
                const svgStartY = startY - window.scrollY;
                const svgEndX = endX - window.scrollX;
                const svgEndY = endY - window.scrollY;

                // 선 그리기 타입 결정
                if (conn.parent === 'logo') {
                    // 로고에서 뻗어나가는 선: 짧고 급격한 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 10} ${svgStartY + 10}, ${svgEndX - 10} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else if (conn.type === 'straight') {
                     // 저자 -> 제목 연결: 직선에 가까운 연결 (L-자형)
                    const midX = svgStartX + distanceX * 0.5;
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} L ${midX} ${svgStartY} L ${midX} ${svgEndY} L ${svgEndX} ${svgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    // 1단계 하위 노드: 중간 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + 40} ${svgStartY}, ${svgEndX - 40} ${svgEndY}, ${svgEndX} ${svgEndY}`);
                } else {
                    // 기본 늘어진 곡선
                    path.setAttribute('d', `M ${svgStartX} ${svgStartY} C ${svgStartX + distanceX * 0.1} ${svgStartY + distanceY * 0.9}, ${svgStartX + distanceX * 0.9} ${svgStartY + distanceY * 0.1}, ${svgEndX} ${svgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 3. 토글 및 모달 표시/닫기 함수
    // ---------------------------------------------

    const toggleArticlesList = (target) => {
        const list = target.closest('.menu-section').querySelector('.menu-children');
        const isExpanded = list.classList.contains('expanded');
        
        if (isExpanded) {
            list.classList.remove('expanded');
        } else {
            list.classList.add('expanded');
        }

        setTimeout(drawConnections, 300);
    };
    
    // 모달 표시 함수
    const showArticleModal = (articleId) => {
        const article = articleData[articleId];
        
        if (!article) {
            closeModal();
            return;
        }

        // 내용 채우기
        modalTitle.textContent = article.title;
        modalMeta.textContent = `${article.author} | ${article.date}`;
        modalBody.innerHTML = article.content.map(p => `<p>${p}</p>`).join('');

        // 노드 활성화
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
        const activeNode = document.querySelector(`[data-article-id="${articleId}"]`);
        if (activeNode) {
            activeNode.classList.add('active');
        }
        
        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    const closeModal = () => {
        modal.style.display = 'none';
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    };

    // ---------------------------------------------
    // 4. 이벤트 리스너 및 초기화
    // ---------------------------------------------
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        
        if (node) {
            // 로고 이미지 자체도 노드로 처리될 수 있으므로, 명시적으로 확인합니다.
            if (node.id === 'logo') {
                closeModal(); 
                document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
                setTimeout(drawConnections, 400);
            } else if (node.classList.contains('article-link')) {
                // 글 클릭 시 모달 표시
                showArticleModal(node.dataset.articleId);
            } else if (node.classList.contains('toggler')) {
                // 토글러 (소개/1호) 클릭 시
                closeModal();
                toggleArticlesList(node);
            }
        }
    });

    // 로고를 위한 별도 이벤트 리스너 추가 (안정성 강화)
    logoElement.addEventListener('click', () => {
        closeModal(); 
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
