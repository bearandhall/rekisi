document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    // 모달 관련 요소 (생략)
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
    const DRAG_THRESHOLD = 5; 

    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    const HORIZONTAL_OFFSET = 180; 
    const AUTHOR_TITLE_OFFSET = 150;
    const VERTICAL_SPACING = 50;

    let articleNodes = [];

    // ---------------------------------------------
    // 1. 글 목록 노드 생성 (유지)
    // ---------------------------------------------
    issue1Articles.forEach((articleId) => {
        const article = articleData[articleId];
        
        const authorNode = document.createElement('div');
        authorNode.classList.add('draggable-node', 'node-author');
        authorNode.dataset.nodeId = article.author;
        authorNode.dataset.authorInfo = article.author; 
        authorNode.textContent = article.author;
        authorNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(authorNode);
        articleNodes.push(authorNode);
        
        const titleNode = document.createElement('div');
        titleNode.classList.add('draggable-node', 'node-title', 'article-link');
        titleNode.dataset.nodeId = article.title; 
        titleNode.dataset.articleId = articleId; 
        titleNode.textContent = article.title;
        titleNode.style.display = 'none'; 
        issue1ChildrenContainer.appendChild(titleNode);
        articleNodes.push(titleNode);
    });
    
    // ---------------------------------------------
    // 2. Drag & Drop 로직 (★터치 클릭 안정화 - 문제 1 해결★)
    // ---------------------------------------------
    
    const getClientCoords = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const startDrag = (e) => {
        const targetNode = e.target.closest('.draggable-node');
        if (!targetNode) return;
        
        // ★모바일에서 기본 스크롤/줌 동작 방지 및 클릭 이벤트 보장★
        if (e.type === 'touchstart') {
            e.preventDefault(); 
        }

        draggedElement = targetNode;
        isDragging = false;
        
        const coords = getClientCoords(e);
        clickStartX = coords.x;
        clickStartY = coords.y;
        
        const rect = targetNode.getBoundingClientRect();
        offsetX = coords.x - rect.left;
        offsetY = coords.y - rect.top;
        
        draggedElement.style.zIndex = 40; 
    };

    const drag = (e) => {
        if (!draggedElement) return;

        const coords = getClientCoords(e);
        const deltaX = Math.abs(coords.x - clickStartX);
        const deltaY = Math.abs(coords.y - clickStartY);

        if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
            isDragging = true;
        }

        if (isDragging) {
            let newX = coords.x - offsetX;
            let newY = coords.y - offsetY;
            
            newX += wrapper.scrollLeft; 
            newY += wrapper.scrollTop;

            draggedElement.style.left = `${newX}px`;
            draggedElement.style.top = `${newY}px`;
            
            requestAnimationFrame(drawConnections);
        }
    };

    const endDrag = (e) => {
        if (draggedElement) {
            draggedElement.style.zIndex = 30;
            
            const coords = getClientCoords(e);
            const deltaX = Math.abs(coords.x - clickStartX);
            const deltaY = Math.abs(coords.y - clickStartY);

            // 드래그가 없었거나, 이동 거리가 임계값 이내일 경우 클릭으로 간주
            if (!isDragging || (deltaX <= DRAG_THRESHOLD && deltaY <= DRAG_THRESHOLD)) {
                handleNodeClick(draggedElement);
            }
        }
        draggedElement = null;
        isDragging = false;
    };
    
    // 마우스 이벤트 리스너
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('mousemove', drag);
    wrapper.addEventListener('mouseup', endDrag);

    // 터치 이벤트 리스너 (모바일 지원)
    wrapper.addEventListener('touchstart', startDrag);
    wrapper.addEventListener('touchmove', drag);
    wrapper.addEventListener('touchend', endDrag);

    // ---------------------------------------------
    // 3. SVG 연결선 동적 그리기 (★스크롤 및 잘림 방지 안정화 - 문제 2 해결★)
    // ---------------------------------------------
    
    const getNodeBoundingBox = (nodeId) => {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeElement) return null;

        // getBoundingClientRect는 뷰포트 기준 좌표를 제공합니다.
        const rect = nodeElement.getBoundingClientRect(); 

        // 뷰포트 좌표에 현재 스크롤 값을 더하여 절대 좌표를 계산합니다.
        const absX = rect.left + wrapper.scrollLeft;
        const absY = rect.top + wrapper.scrollTop;
        
        return { 
            absX: absX, 
            absY: absY, 
            width: rect.width, 
            height: rect.height,
        }; 
    };

    const drawConnections = () => {
        connectionLinesSvg.innerHTML = '';
        
        const connections = [];

        connections.push({ parentId: 'logo', childId: '소개', type: 'logo' });
        connections.push({ parentId: 'logo', childId: '1호', type: 'logo' });

        if (issue1Node.classList.contains('expanded')) {
            issue1Articles.forEach(articleId => {
                const article = articleData[articleId];
                connections.push({ parentId: '1호', childId: article.author, type: 'parent' });
                connections.push({ parentId: article.author, childId: article.title, type: 'straight' });
            });
        }
        
        // SVG 영역의 너비/높이를 현재 뷰포트와 스크롤 영역을 포함하도록 조정
        const svgWidth = wrapper.scrollWidth;
        const svgHeight = wrapper.offsetHeight; // 높이는 뷰포트 고정 (세로 스크롤 없음)
        connectionLinesSvg.style.width = `${svgWidth}px`;
        connectionLinesSvg.style.height = `${svgHeight}px`;

        connections.forEach(conn => {
            const parentBox = getNodeBoundingBox(conn.parentId);
            const childNode = document.querySelector(`[data-node-id="${conn.childId}"]`);
            const childBox = getNodeBoundingBox(conn.childId);
            
            if (parentBox && childBox && childNode) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                const scrollLeft = wrapper.scrollLeft;
                const scrollTop = wrapper.scrollTop; // 현재는 overflow-y: hidden 이므로 0

                // 시작점: 부모 노드의 절대 좌표 (ABS - SCROLL) = SVG 뷰포트 좌표
                const startX = parentBox.absX + (conn.parentId === 'logo' ? parentBox.width / 2 : parentBox.width) - scrollLeft;
                const startY = parentBox.absY + (conn.parentId === 'logo' ? parentBox.height : parentBox.height / 2) - scrollTop;
                
                // 끝점: 자식 노드의 절대 좌표 (ABS - SCROLL) = SVG 뷰포트 좌표
                const endX = childBox.absX - scrollLeft; 
                const endY = childBox.absY + childBox.height / 2 - scrollTop;
                
                const distanceX = endX - startX;
                const distanceY = endY - startY;

                let dPath;

                if (conn.type === 'logo') {
                    dPath = `M ${startX} ${startY} C ${startX + 30} ${startY + 30}, ${endX - 30} ${endY}, ${endX} ${endY}`;
                } else if (conn.type === 'straight') {
                    const midX = startX + distanceX * 0.5;
                    dPath = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
                } else {
                    dPath = `M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`;
                }
                
                path.setAttribute('d', dPath);
                connectionLinesSvg.appendChild(path);
            }
        });
    };

    // ---------------------------------------------
    // 4. 클릭 이벤트 및 모달 처리 로직 (유지)
    // ---------------------------------------------
    
    const handleNodeClick = (node) => {
        if (node.dataset.nodeId === 'logo') {
            hideIssueChildren();
            closeModal();
            drawConnections();
            return;
        }

        if (node.dataset.nodeId === '소개') {
            hideIssueChildren();
            const introArticle = articleData['intro_rekisi'];
            showArticleModal(introArticle.title, 'REKISI 편집부', null, introArticle.content, 'article');
            drawConnections();
            return;
        }

        if (node.dataset.nodeId === '1호') {
            toggleIssueChildren(node);
            return;
        }
        
        if (node.classList.contains('node-author')) {
            handleAuthorClick(node.dataset.nodeId);
            return;
        }
        
        if (node.classList.contains('article-link')) {
            const articleId = node.dataset.articleId;
            const article = articleData[articleId];
            showArticleModal(article.title, article.author, article.author_intro, article.content, 'article');
            return;
        }
    };
    
    const toggleIssueChildren = (togglerNode) => {
        const isExpanded = togglerNode.classList.toggle('expanded');
        
        if (isExpanded) {
            const parentX = togglerNode.offsetLeft;
            const parentY = togglerNode.offsetTop;
            
            articleNodes.forEach((node, index) => {
                const articleIndex = Math.floor(index / 2);
                const isAuthorNode = index % 2 === 0;
                
                let newX = parentX + HORIZONTAL_OFFSET;
                let newY = parentY + (articleIndex * VERTICAL_SPACING);

                if (!isAuthorNode) {
                    newX += AUTHOR_TITLE_OFFSET;
                }
                
                node.style.left = `${newX}px`;
                node.style.top = `${newY}px`;
                node.style.display = 'block';
            });
            
        } else {
            articleNodes.forEach(node => {
                node.style.display = 'none';
            });
        }

        setTimeout(drawConnections, 50); 
    };

    const hideIssueChildren = () => {
        issue1Node.classList.remove('expanded');
        articleNodes.forEach(node => {
            node.style.display = 'none';
        });
    };
    
    const handleAuthorClick = (authorName) => {
        const article = issue1Articles.map(id => articleData[id]).find(a => a.author === authorName);
        
        if (article && article.author_intro) {
             showArticleModal(
                `저자: ${authorName}`, 
                null, 
                article.author_intro, 
                ['이 곳에서 작가의 다른 글을 확인하실 수 있습니다.'],
                'author'
            );
        } else {
            showArticleModal(
                `저자: ${authorName}`,
                null,
                '아직 등록된 상세 저자 소개가 없습니다.',
                [],
                'author'
            );
        }
    };
    
    const showArticleModal = (title, author, authorIntro, content, type) => {
        modalTitle.textContent = title;
        modalBody.innerHTML = content.map(p => `<p>${p}</p>`).join('');
        
        if (type === 'article' && author) {
             modalMeta.textContent = author;
             modalAuthorIntro.innerHTML = authorIntro ? `<strong>저자 소개:</strong> ${authorIntro}` : '';
        } else if (type === 'author') {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = authorIntro;
        } else {
             modalMeta.textContent = '';
             modalAuthorIntro.innerHTML = '';
        }

        modal.style.display = 'block';
        modal.scrollTop = 0;
    };
    
    const closeModal = () => {
        modal.style.display = 'none';
    };
    
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) { closeModal(); }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { closeModal(); }
    });

    window.addEventListener('resize', drawConnections);
    // 모바일 스크롤 발생 시 선 다시 그리기
    wrapper.addEventListener('scroll', drawConnections); 
    setTimeout(drawConnections, 10);
});
