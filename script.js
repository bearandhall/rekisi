document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const articlesListDiv = document.querySelector('.articles-list');
    const logoElement = document.getElementById('logo'); 
    
    // ... (이전 코드 유지)
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');
    
    const introSectionChildren = document.querySelector('#intro-section .menu-children');
    introSectionChildren.innerHTML = `<div class="node title-node article-link" data-node-id="소개글" data-article-id="intro_rekisi">레키시는 ...</div>`;

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
    // 2. SVG 연결선 그리기 함수 (★스크롤 반영하여 수정★)
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
                 
                 connections.push({ parent: '1호', child: article.author });
                 connections.push({ parent: article.author, child: article.title, type: 'straight' });
             });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            // sidebar의 스크롤 위치를 가져와 보정합니다. (핵심 수정)
            const scrollCompensation = sidebar.scrollTop; 
            
            let x, y;
            
            if (nodeId === 'logo') { 
                // 로고 중앙 하단에서 선 시작
                x = rect.left + rect.width / 2; // X
                y = rect.bottom; // Y (스크롤은 나중에 SVG 좌표에 반영)
            } else {
                // 일반 노드 오른쪽 중앙에서 선 시작
                x = rect.left + rect.width;
                y = rect.top + rect.height / 2;
            }
            
            return { x, y, scrollCompensation }; // 스크롤 보정 값을 함께 반환
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parent);
            const childNode = document.querySelector(`[data-node-id="${conn.child}"]`);
            const childPos = getNodeRect(conn.child);
            
            if (parentPos && childPos) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // 화면 기준으로 절대 좌표 계산 (parentPos/childPos는 이미 뷰포트 기준)
                const startX = parentPos.x; 
                const startY = parentPos.y + parentPos.scrollCompensation; // 스크롤 보정 적용 (Y축만)
                
                // 자식 노드의 왼쪽 끝 좌표 계산
                const endX = childPos.x - (childNode ? childNode.offsetWidth : 0); 
                const endY = childPos.y + childPos.scrollCompensation; // 스크롤 보정 적용 (Y축만)

                const distanceX = endX - startX;
                const distanceY = endY - startY;

                // SVG 좌표는 항상 0,0을 기준으로 하므로,
                // 스크롤이 적용된 절대 좌표에서 스크롤 값을 다시 빼서 SVG의 뷰포트에 맞춥니다.
                // 하지만 GBCR이 뷰포트 기준이므로, SVG의 뷰포트를 기준으로 다시 계산.
                // SVG 좌표 (뷰포트 기준)
                const svgStartX = startX;
                const svgStartY = parentPos.y;
                const svgEndX = endX;
                const svgEndY = childPos.y;
                
                const currentScrollY = sidebar.scrollTop;
                
                // 뷰포트 기준으로 계산된 GBCR 값에, 현재 스크롤 값을 더해서 실제 페이지상의 위치를 구합니다.
                // 그리고 이를 SVG의 Y 좌표로 사용합니다. (SVG는 Fixed position처럼 작동하므로)
                const finalSvgStartY = svgStartY + currentScrollY;
                const finalSvgEndY = svgEndY + currentScrollY;
                
                // Y 좌표만 스크롤에 따라 이동해야 하므로, 최종적으로 Y좌표에 스크롤 값을 더합니다.
                
                if (conn.parent === 'logo') {
                    path.setAttribute('d', `M ${svgStartX} ${finalSvgStartY} C ${svgStartX + 10} ${finalSvgStartY + 10}, ${svgEndX - 10} ${finalSvgEndY}, ${svgEndX} ${finalSvgEndY}`);
                } else if (conn.type === 'straight') {
                    const midX = svgStartX + distanceX * 0.5;
                    path.setAttribute('d', `M ${svgStartX} ${finalSvgStartY} L ${midX} ${finalSvgStartY} L ${midX} ${finalSvgEndY} L ${svgEndX} ${finalSvgEndY}`);
                } else if (conn.parent === '소개' || conn.parent === '1호') {
                    path.setAttribute('d', `M ${svgStartX} ${finalSvgStartY} C ${svgStartX + 40} ${finalSvgStartY}, ${svgEndX - 40} ${finalSvgEndY}, ${svgEndX} ${finalSvgEndY}`);
                } else {
                    // 일반적인 곡선 계산은 유지 (X 거리와 Y 거리를 사용하여 곡선 정의)
                    const curveControlY1 = finalSvgStartY + distanceY * 0.9;
                    const curveControlY2 = finalSvgEndY - distanceY * 0.9;
                    path.setAttribute('d', `M ${svgStartX} ${finalSvgStartY} C ${svgStartX + distanceX * 0.1} ${curveControlY1}, ${svgEndX - distanceX * 0.1} ${curveControlY2}, ${svgEndX} ${finalSvgEndY}`);
                }
                
                connectionLinesSvg.appendChild(path);
            }
        });
    };
    
    // ... (이전 코드 유지: 모달 표시/닫기 함수)
    const closeModal = () => {
        const modal = document.getElementById('article-modal');
        modal.style.display = 'none';
        document.querySelectorAll('.node').forEach(node => node.classList.remove('active'));
    };
    
    // ... (이전 코드 유지: 이벤트 리스너)
    sidebar.addEventListener('click', (event) => {
        const node = event.target.closest('.node');
        if (node) {
            // ... (이전 로직 유지)
        }
    });

    logoElement.addEventListener('click', () => {
        closeModal(); 
        document.querySelectorAll('.menu-children').forEach(list => list.classList.remove('expanded'));
        setTimeout(drawConnections, 400);
    });

    // 모달 닫기 이벤트 등 (이전 코드 유지)
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('article-modal')) {
            closeModal();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // 스크롤 이벤트에 따라 선을 다시 그리도록 바인딩
    window.addEventListener('resize', drawConnections);
    sidebar.addEventListener('scroll', drawConnections); 

    // 초기 로드 시: 하위 메뉴 숨기기 및 선 그리기
    document.querySelectorAll('.menu-children').forEach(list => {
        list.classList.remove('expanded');
    });
    
    setTimeout(drawConnections, 10);
});
