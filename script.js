document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    // 모달 관련 요소 (유지)
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
    // 2. Drag & Drop 로직 (유지)
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
            e.preventDefault(); 
            
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
            
            if (!isDragging) {
                handleNodeClick(draggedElement);
            }
        }
        draggedElement = null;
        isDragging = false;
    };
    
    wrapper.addEventListener('mousedown', startDrag);
    wrapper.addEventListener('mousemove', drag);
    wrapper.addEventListener('mouseup', endDrag);

    wrapper.addEventListener('touchstart', startDrag);
    wrapper.addEventListener('touchmove', drag);
    wrapper.addEventListener('touchend', endDrag);


    // ---------------------------------------------
    // 3. SVG 연결선 동적 그리기 (★스크롤 좌표 계산 재정비 핵심 수정★)
    // ---------------------------------------------
    
    const getNodeAbsolutePos = (nodeId) => {
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (!nodeElement) return null;

        // wrapper 내에서의 절대 위치 (offset)
        return { 
            x: nodeElement.offsetLeft, 
            y: nodeElement.offsetTop, 
            width: nodeElement.offsetWidth, 
            height: nodeElement.offsetHeight,
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
        
        // SVG 영역을 충분히 넓게 설정 (스크롤 영역 커버)
        connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
        connectionLinesSvg.style.height = `${wrapper.offsetHeight}px`; // 높이는 뷰포트 고정

        const scrollLeft = wrapper.scrollLeft;
        const scrollTop = wrapper.scrollTop; // 현재는 0

        connections.forEach(conn => {
            const parentPos = getNodeAbsolutePos(conn.parentId);
            const childNode = document.querySelector(`[data-node-id="${conn.childId}"]`);
            const childPos = getNodeAbsolutePos(conn.childId);
            
            if (parentPos && childPos && childNode) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                
                // 1. 노드의 절대 위치 (wrapper 내) 계산
                const absStartX = parentPos.x + (conn.parentId === 'logo' ? parentPos.width / 2 : parentPos.width);
                const absStartY = parentPos.y + (conn.parentId === 'logo' ? parentPos.height : parentPos.height / 2);
                
                const absEndX = childPos.x; 
                const absEndY = childPos.y + childPos.height / 2;
                
                // 2. SVG 뷰포트 좌표로 변환 (절대 위치 - 스크롤 값)
                // 이 subtraction이 스크롤 시 선이 노드를 따라가도록 보정하는 핵심입니다.
                const svgStartX = absStartX - scrollLeft;
                const svgStartY = absStartY - scrollTop; 
                const svgEndX = absEndX - scrollLeft; 
                const svgEndY = absEndY - scrollTop;
                
                const distanceX = svgEndX - svgStartX;
                const distanceY = svgEndY - svgStartY;

                let dPath;

                if (conn.type === 'logo') {
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 30} ${svgStartY + 30}, ${svgEndX - 30} ${svgEndY}, ${svgEndX} ${svgEndY}`;
                } else if (conn.type === 'straight') {
                    const midX = svgStartX + distanceX * 0.5;
                    dPath = `M ${svgStartX} ${svgStartY} L ${midX} ${svgStartY} L ${midX} ${svgEndY} L ${svgEndX} ${svgEndY}`;
                } else {
                    dPath = `M ${svgStartX} ${svgStartY} C ${svgStartX + 60} ${startY}, ${svgEndX - 60} ${svgEndY}, ${svgEndX} ${svgEndY}`;
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
    wrapper.addEventListener('scroll', drawConnections); 
    setTimeout(drawConnections, 10);
});
