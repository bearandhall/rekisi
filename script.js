document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    // 모달 관련 요소
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalAuthorIntro = document.getElementById('modal-author-intro');
    const modalBody = document.getElementById('modal-article-body');

    let draggedElement = null;
    let offsetX, offsetY;
    let isDragging = false;
    let clickStartX, clickStartY;
    const DRAG_THRESHOLD = 5; // 5px 이상 이동해야 드래그로 간주

    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    // ---------------------------------------------
    // 1. 글 목록 동적 생성 및 초기 배치
    // ---------------------------------------------
    const initialPositions = [
        { x: 150, y: 350 }, { x: 150, y: 450 }, { x: 150, y: 550 },
        { x: 350, y: 350 }, { x: 350, y: 450 }, { x: 350, y: 550 },
    ];
    let articleNodes = [];

    // '소개글' 노드는 이제 '소개' 버튼 안에 내용이 포함되는 식으로 처리하거나, 
    // 모달 클릭 전용으로 사용하여 메인 화면 노드로 추가하지 않습니다. 

    issue1Articles.forEach((articleId, index) => {
        const article = articleData[articleId];
        const pos = initialPositions[index] || initialPositions[0]; // 초기 배치 위치
        
        // 저자 노드
        const authorNode = document.createElement('div');
        authorNode.classList.add('draggable-node', 'node-author');
        authorNode.dataset.nodeId = article.author;
        authorNode.style.left = `${pos.x}px`;
        authorNode.style.top = `${pos.y}px`;
        authorNode.textContent = article.author;
        authorNode.style.display = 'none'; // 초기에는 숨김
        issue1ChildrenContainer.appendChild(authorNode);
        articleNodes.push(authorNode);
        
        // 제목 노드 (클릭 가능)
        const titleNode = document.createElement('div');
        titleNode.classList.add('draggable-node', 'node-title', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.style.left = `${pos.x + 150}px`;
        titleNode.style.top = `${pos.y}px`;
        titleNode.textContent = article.title;
        titleNode.style.display = 'none'; // 초기에는 숨김
        issue1ChildrenContainer.appendChild(titleNode);
        articleNodes.push(titleNode);
    });
    
    // ---------------------------------------------
    // 2. Drag & Drop 로직
    // ---------------------------------------------

    // 마우스 누름
    wrapper.addEventListener('mousedown', (e) => {
        const targetNode = e.target.closest('.draggable-node');
        if (!targetNode) return;

        draggedElement = targetNode;
        isDragging = false;
        clickStartX = e.clientX;
        clickStartY = e.clientY;
        
        // 드래그 시작 시 요소의 초기 위치와 마우스 커서 위치 차이 계산
        offsetX = e.clientX - targetNode.getBoundingClientRect().left;
        offsetY = e.clientY - targetNode.getBoundingClientRect().top;
        
        draggedElement.style.zIndex = 40; // 드래그 중인 요소를 위로 올림
    });

    // 마우스 이동
    wrapper.addEventListener('mousemove', (e) => {
        if (!draggedElement) return;

        const deltaX = Math.abs(e.clientX - clickStartX);
        const deltaY = Math.abs(e.clientY - clickStartY);

        // 일정 임계값 이상 이동해야 드래그 시작으로 간주
        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            isDragging = true;
        }

        if (isDragging) {
            // 새로운 위치 계산
            let newX = e.clientX - offsetX;
            let newY = e.clientY - offsetY;
            
            // 화면 경계 제한
            const maxX = wrapper.offsetWidth - draggedElement.offsetWidth;
            const maxY = wrapper.offsetHeight - draggedElement.offsetHeight;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            // CSS 위치 업데이트
            draggedElement.style.left = `${newX}px`;
            draggedElement.style.top = `${newY}px`;
            
            // 위치 변경 시 선 다시 그리기 요청
            requestAnimationFrame(drawConnections);
        }
    });

    // 마우스 떼기
    wrapper.addEventListener('mouseup', (e) => {
        if (draggedElement) {
            draggedElement.style.zIndex = 30;
            
            if (!isDragging) {
                // 드래그 없이 클릭했을 때만 클릭 이벤트 처리
                handleNodeClick(draggedElement);
            }
        }
        draggedElement = null;
        isDragging = false;
    });

    // ---------------------------------------------
    // 3. SVG 연결선 동적 그리기
    // ---------------------------------------------

    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [];

        // 1. 로고 -> 소개, 로고 -> 1호 연결
        connections.push({ parentId: 'logo', childId: '소개', type: 'logo' });
        connections.push({ parentId: 'logo', childId: '1호', type: 'logo' });

        // 2. 1호 하위 목록 연결
        if (issue1Node.classList.contains('expanded')) {
            issue1Articles.forEach(articleId => {
                const article = articleData[articleId];
                // 1호 -> 저자
                connections.push({ parentId: '1호', childId: article.author, type: 'parent' });
                // 저자 -> 제목
                connections.push({ parentId: article.author, childId: article.title, type: 'straight' });
            });
        }
        
        const getNodeRect = (nodeId) => {
            const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
            if (!nodeElement) return null;

            const rect = nodeElement.getBoundingClientRect();
            
            let startX, startY;
            
            if (nodeId === 'logo') { 
                // 로고 중앙 하단
                startX = rect.left + rect.width / 2; 
                startY = rect.bottom; 
            } else {
                // 일반 노드 오른쪽 중앙
                startX = rect.left + rect.width;
                startY = rect.top + rect.height / 2;
            }
            
            return { x: startX, y: startY, width: rect.width, height: rect.height }; 
        };

        connections.forEach(conn => {
            const parentPos = getNodeRect(conn.parentId);
            const childNode = document.querySelector(`[data-node-id="${conn.childId}"]`);
            const childPos = getNodeRect(conn.childId);
            
            if (parentPos && childPos && childNode) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

                // 뷰포트 기준 좌표
                const svgStartX = parentPos.x; 
                const svgStartY = parentPos.y; 
                const svgEndX = childPos.x - childNode.offsetWidth; // 자식 노드 왼쪽 끝
                const svgEndY = childPos.y;
                
                const distanceX = svgEndX - svgStartX;
                const distanceY = svgEndY - svgStartY;
                
                let dPath;

                if (conn.type === 'logo') {
                    // 로고에서 뻗어나가는 선
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 30} ${svgStartY + 30}, ${svgEndX - 30} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                } else if (conn.type === 'straight') {
                     // 저자 -> 제목 연결: L-자형
                    const midX = svgStartX + distanceX * 0.5;
                    dPath = `M ${svgStartX} ${svgStartY} L ${midX} ${svgStartY} L ${midX} ${svgEndY} L ${svgEndX} ${svgEndY}`;
                } else {
                    // 1단계 하위 노드 (1호 -> 저자)
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 60} ${svgStartY}, ${svgEndX - 60} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                }
                
                path.setAttribute('d', dPath);
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 4. 클릭 이벤트 및 모달 처리 로직
    // ---------------------------------------------
    
    const handleNodeClick = (node) => {
        // 로고 클릭 (메인 화면 복귀)
        if (node.dataset.nodeId === 'logo') {
            hideIssueChildren();
            closeModal();
            drawConnections();
            return;
        }

        // 소개 클릭 (모달 팝업)
        if (node.dataset.nodeId === '소개') {
            hideIssueChildren();
            const introArticle = articleData['intro_rekisi'];
            showArticleModal(introArticle.title, 'REKISI 편집부', null, introArticle.content);
            drawConnections();
            return;
        }

        // 1호 클릭 (글 목록 토글)
        if (node.dataset.nodeId === '1호') {
            toggleIssueChildren(node);
            return;
        }
        
        // 개별 글 제목 클릭 (모달 팝업)
        if (node.classList.contains('article-link')) {
            const articleId = node.dataset.articleId;
            const article = articleData[articleId];
            showArticleModal(article.title, article.author, article.author_intro, article.content);
            return;
        }
    };

    const toggleIssueChildren = (togglerNode) => {
        const isExpanded = togglerNode.classList.toggle('expanded');
        
        articleNodes.forEach(node => {
            node.style.display = isExpanded ? 'block' : 'none';
        });

        // 숨겨져 있던 요소가 나타날 때 정확한 위치 계산을 위해 잠시 기다린 후 그리기
        setTimeout(drawConnections, 50); 
    };
    
    const hideIssueChildren = () => {
        issue1Node.classList.remove('expanded');
        articleNodes.forEach(node => {
            node.style.display = 'none';
        });
    };

    const showArticleModal = (title, author, authorIntro, content) => {
        // 모달 내용 채우기 (저자 소개 포함)
        modalTitle.textContent = title;
        modalMeta.textContent = author;
        
        if (authorIntro) {
            modalAuthorIntro.innerHTML = `<strong>저자 소개:</strong> ${authorIntro}`;
        } else {
            modalAuthorIntro.innerHTML = '';
        }
        
        modalBody.innerHTML = content.map(p => `<p>${p}</p>`).join('');

        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    const closeModal = () => {
        modal.style.display = 'none';
    };

    // 모달 닫기 이벤트 리스너
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

    // 초기 선 그리기
    window.addEventListener('resize', drawConnections);
    setTimeout(drawConnections, 10);
});
