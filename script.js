document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const connectionLinesSvg = document.getElementById('connection-lines');
    const issue1ChildrenContainer = document.getElementById('issue-1-children-container');
    const logoNode = document.getElementById('logo-node');
    const introNode = document.getElementById('intro-node');
    const issue1Node = document.getElementById('issue-1-node');
    
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalTitle = document.getElementById('modal-article-title');
    const modalMeta = document.getElementById('modal-article-meta');
    const modalAuthorIntro = document.getElementById('modal-author-intro');
    const modalBody = document.getElementById('modal-article-body');

    let draggedElement = null;
    let offsetX, offsetY;
    let articleNodes = [];

    // articleData는 기존 window 객체에서 가져옴
    const articleData = window.articleData || {};
    const issue1Articles = Object.keys(articleData).filter(id => id !== 'intro_rekisi');

    const HORIZONTAL_OFFSET = 180;
    const AUTHOR_TITLE_OFFSET = 150;
    const VERTICAL_SPACING = 60;

    const init = () => {
        const isMobile = window.innerWidth <= 600;
        const baseTop = isMobile ? 130 : 60;

        logoNode.style.left = '50px';
        logoNode.style.top = `${baseTop}px`;
        introNode.style.left = `${isMobile ? 180 : 250}px`;
        introNode.style.top = `${baseTop + 15}px`;
        issue1Node.style.left = '50px';
        issue1Node.style.top = `${baseTop + 130}px`;

        addActionButton(introNode, 'intro');
        addActionButton(issue1Node, 'toggle');

        issue1Articles.forEach((id) => {
            const data = articleData[id];
            
            const auth = document.createElement('div');
            auth.className = 'draggable-node node-author';
            auth.dataset.nodeId = data.author;
            auth.textContent = data.author;
            auth.style.display = 'none';
            addActionButton(auth, 'author-modal');
            issue1ChildrenContainer.appendChild(auth);
            articleNodes.push(auth);
            
            const tit = document.createElement('div');
            tit.className = 'draggable-node node-title';
            tit.dataset.nodeId = data.title;
            tit.dataset.articleId = id;
            tit.textContent = data.title;
            tit.style.display = 'none';
            addActionButton(tit, 'article-modal');
            issue1ChildrenContainer.appendChild(tit);
            articleNodes.push(tit);
        });
    };

    // 버튼 안을 다시 작은 네모(□)로 복구
    function addActionButton(node, type) {
        const btn = document.createElement('div');
        btn.className = 'node-action-btn';
        btn.dataset.actionType = type;
        btn.innerHTML = '&#x25A1;'; 
        node.appendChild(btn);
    }

    const getCoords = (e) => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

    // 드래그 로직 (버튼 클릭 방해 금지)
    const startDrag = (e) => {
        if (e.target.closest('.node-action-btn')) return; // 버튼 클릭 시 드래그 무시

        const node = e.target.closest('.draggable-node');
        if (!node) return;

        draggedElement = node;
        const c = getCoords(e);
        const rect = node.getBoundingClientRect();
        offsetX = c.x - rect.left;
        offsetY = c.y - rect.top;
        draggedElement.style.zIndex = 100;
        
        if (e.type === 'mousedown') e.preventDefault(); 
    };

    const doDrag = (e) => {
        if (!draggedElement) return;
        const c = getCoords(e);
        draggedElement.style.left = `${c.x - offsetX + wrapper.scrollLeft}px`;
        draggedElement.style.top = `${c.y - offsetY + wrapper.scrollTop}px`;
        drawConnections();
    };

    const stopDrag = () => { if (draggedElement) draggedElement.style.zIndex = 30; draggedElement = null; };

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
    wrapper.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    const getPos = (id) => {
        const el = document.querySelector(`[data-node-id="${id}"]`);
        if (!el || el.style.display === 'none') return null;
        return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    };

    const drawConnections = () => {
        requestAnimationFrame(() => {
            connectionLinesSvg.innerHTML = '';
            connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
            connectionLinesSvg.style.height = `${wrapper.scrollHeight}px`;

            const conns = [
                { p: 'logo', c: '소개', type: 'logo' },
                { p: 'logo', c: '1호', type: 'logo' }
            ];

            if (issue1Node.classList.contains('expanded')) {
                issue1Articles.forEach(id => {
                    const data = articleData[id];
                    conns.push({ p: '1호', c: data.author, type: 'parent' });
                    conns.push({ p: data.author, c: data.title, type: 'straight' });
                });
            }

            conns.forEach(conn => {
                const p = getPos(conn.p);
                const c = getPos(conn.c);
                if (p && c) {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    if (conn.type === 'straight') path.setAttribute('class', 'line-straight');

                    const sX = p.x + (conn.type === 'logo' ? p.w/2 : p.w);
                    const sY = p.y + (conn.type === 'logo' ? p.h : p.h/2);
                    const eX = c.x;
                    const eY = c.y + c.h/2;
                    
                    path.setAttribute('d', `M ${sX} ${sY} C ${sX + (conn.type==='logo'?40:70)} ${sY}, ${eX - (conn.type==='logo'?40:70)} ${eY}, ${eX} ${eY}`);
                    connectionLinesSvg.appendChild(path);
                }
            });
        });
    };

    // 클릭 핸들러 (토글 및 모달 호출 완벽 복구)
    wrapper.addEventListener('click', (e) => {
        const btn = e.target.closest('.node-action-btn');
        if (!btn) return;
        
        e.stopPropagation();
        const node = btn.closest('.draggable-node');
        const action = btn.dataset.actionType;

        if (action === 'toggle') {
            const isExp = node.classList.toggle('expanded');
            articleNodes.forEach((n, i) => {
                if (isExp) {
                    n.style.display = 'block';
                    const parentX = node.offsetLeft;
                    const parentY = node.offsetTop;
                    const idx = Math.floor(i/2);
                    const isTitle = i % 2 === 1;
                    n.style.left = `${parentX + HORIZONTAL_OFFSET + (isTitle ? AUTHOR_TITLE_OFFSET : 0)}px`;
                    n.style.top = `${parentY + idx * VERTICAL_SPACING}px`;
                } else { n.style.display = 'none'; }
            });
            setTimeout(drawConnections, 60);
        } 
        else if (action === 'intro') {
            const data = articleData['intro_rekisi'];
            showModal(data.title, "REKISI 편집부", null, data.content);
        }
        else if (action === 'article-modal') {
            const data = articleData[node.dataset.articleId];
            showModal(data.title, data.author, data.author_intro, data.content);
        }
        else if (action === 'author-modal') {
            const authorName = node.dataset.nodeId;
            const data = Object.values(articleData).find(a => a.author === authorName);
            showModal(`저자: ${authorName}`, null, data ? data.author_intro : "등록된 소개가 없습니다.", []);
        }
    });

    const showModal = (title, meta, intro, body) => {
        modalTitle.textContent = title;
        modalMeta.textContent = meta || "";
        modalAuthorIntro.innerHTML = intro ? `<strong>저자 소개:</strong> ${intro}` : "";
        modalAuthorIntro.style.display = intro ? "block" : "none";
        modalBody.innerHTML = (body || []).map(p => `<p>${p}</p>`).join('');
        modal.style.display = 'block';
        modalBody.scrollTop = 0;
    };

    closeBtn.onclick = () => modal.style.display = 'none';

    init();
    window.addEventListener('resize', drawConnections);
    wrapper.addEventListener('scroll', drawConnections);
    setTimeout(drawConnections, 300);
});
