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

        addBtn(introNode, 'intro');
        addBtn(issue1Node, 'toggle');

        issue1Articles.forEach((id) => {
            const data = articleData[id];
            const auth = document.createElement('div');
            auth.className = 'draggable-node node-author';
            auth.dataset.nodeId = data.author;
            auth.textContent = data.author;
            auth.style.display = 'none';
            addBtn(auth, 'author-modal');
            issue1ChildrenContainer.appendChild(auth);
            articleNodes.push(auth);
            
            const tit = document.createElement('div');
            tit.className = 'draggable-node node-title';
            tit.dataset.nodeId = data.title;
            tit.dataset.articleId = id;
            tit.textContent = data.title;
            tit.style.display = 'none';
            addBtn(tit, 'article-modal');
            issue1ChildrenContainer.appendChild(tit);
            articleNodes.push(tit);
        });
    };

    // 버튼 생성 시 클릭 이벤트 직접 할당 (가장 확실한 방법)
    function addBtn(node, type) {
        const btn = document.createElement('div');
        btn.className = 'node-action-btn';
        btn.innerHTML = '&#x25A1;';
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAction(node, type);
        };
        
        node.appendChild(btn);
    }

    function handleAction(node, type) {
        if (type === 'toggle') {
            const isExp = node.classList.toggle('expanded');
            articleNodes.forEach((n, i) => {
                if (isExp) {
                    n.style.display = 'block';
                    const idx = Math.floor(i/2);
                    const isTitle = i % 2 === 1;
                    n.style.left = `${node.offsetLeft + HORIZONTAL_OFFSET + (isTitle ? AUTHOR_TITLE_OFFSET : 0)}px`;
                    n.style.top = `${node.offsetTop + idx * VERTICAL_SPACING}px`;
                } else { n.style.display = 'none'; }
            });
            setTimeout(draw, 60);
        } else if (type === 'intro') {
            const d = articleData['intro_rekisi'];
            show(d.title, "REKISI 편집부", null, d.content);
        } else if (type === 'article-modal') {
            const d = articleData[node.dataset.articleId];
            show(d.title, d.author, d.author_intro, d.content);
        } else if (type === 'author-modal') {
            const name = node.dataset.nodeId;
            const d = Object.values(articleData).find(a => a.author === name);
            show(`저자: ${name}`, null, d ? d.author_intro : "소개가 없습니다.", []);
        }
    }

    const getC = (e) => e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };

    const startDrag = (e) => {
        if (e.target.closest('.node-action-btn')) return;
        const node = e.target.closest('.draggable-node');
        if (!node) return;
        draggedElement = node;
        const c = getC(e);
        const rect = node.getBoundingClientRect();
        offsetX = c.x - rect.left;
        offsetY = c.y - rect.top;
        draggedElement.style.zIndex = 100;
    };

    const doDrag = (e) => {
        if (!draggedElement) return;
        const c = getC(e);
        draggedElement.style.left = `${c.x - offsetX + wrapper.scrollLeft}px`;
        draggedElement.style.top = `${c.y - offsetY + wrapper.scrollTop}px`;
        draw();
    };

    const stopDrag = () => { if (draggedElement) draggedElement.style.zIndex = 30; draggedElement = null; };

    wrapper.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
    wrapper.addEventListener('touchstart', startDrag);
    window.addEventListener('touchmove', doDrag, { passive: false });
    window.addEventListener('touchend', stopDrag);

    const getP = (id) => {
        const el = document.querySelector(`[data-node-id="${id}"]`);
        if (!el || el.style.display === 'none') return null;
        return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    };

    const draw = () => {
        requestAnimationFrame(() => {
            connectionLinesSvg.innerHTML = '';
            connectionLinesSvg.style.width = `${wrapper.scrollWidth}px`;
            connectionLinesSvg.style.height = `${wrapper.scrollHeight}px`;
            const conns = [{ p: 'logo', c: '소개', type: 'logo' }, { p: 'logo', c: '1호', type: 'logo' }];
            if (issue1Node.classList.contains('expanded')) {
                issue1Articles.forEach(id => {
                    const data = articleData[id];
                    conns.push({ p: '1호', c: data.author, type: 'parent' }, { p: data.author, c: data.title, type: 'straight' });
                });
            }
            conns.forEach(conn => {
                const p = getP(conn.p), c = getP(conn.c);
                if (p && c) {
                    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    if (conn.type === 'straight') path.setAttribute('class', 'line-straight');
                    const sX = p.x + (conn.type === 'logo' ? p.w/2 : p.w), sY = p.y + (conn.type === 'logo' ? p.h : p.h/2);
                    const eX = c.x, eY = c.y + c.h/2;
                    path.setAttribute('d', `M ${sX} ${sY} C ${sX + (conn.type==='logo'?40:70)} ${sY}, ${eX - (conn.type==='logo'?40:70)} ${eY}, ${eX} ${eY}`);
                    connectionLinesSvg.appendChild(path);
                }
            });
        });
    };

    const show = (t, m, i, b) => {
        modalTitle.textContent = t;
        modalMeta.textContent = m || "";
        modalAuthorIntro.innerHTML = i ? `<strong>저자 소개:</strong> ${i}` : "";
        modalAuthorIntro.style.display = i ? "block" : "none";
        modalBody.innerHTML = (b || []).map(p => `<p>${p}</p>`).join('');
        modal.style.display = 'block';
    };

    closeBtn.onclick = () => modal.style.display = 'none';
    init();
    window.addEventListener('resize', draw);
    wrapper.addEventListener('scroll', draw);
    setTimeout(draw, 300);
});
