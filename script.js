document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper');
    const linesSvg = document.getElementById('connection-lines');
    const issue1Children = document.getElementById('issue-1-children-container');
    const logo = document.getElementById('logo-node');
    const intro = document.getElementById('intro-node');
    const issue1 = document.getElementById('issue-1-node');
    const modal = document.getElementById('article-modal');
    
    let dragged = null;
    let offset = { x: 0, y: 0 };
    let nodesList = [];

    // 사용자님의 소중한 데이터 (반드시 유지)
    const data = window.articleData || {};
    const articles = Object.keys(data).filter(id => id !== 'intro_rekisi');

    const init = () => {
        logo.style.left = '50px'; logo.style.top = '60px';
        intro.style.left = '250px'; intro.style.top = '75px';
        issue1.style.left = '50px'; issue1.style.top = '190px';

        addBtn(intro, 'intro');
        addBtn(issue1, 'toggle');

        articles.forEach((id) => {
            const item = data[id];
            const a = createNode(item.author, 'node-author', item.author, 'author-modal', id);
            const t = createNode(item.title, 'node-title', item.title, 'article-modal', id);
            issue1Children.appendChild(a);
            issue1Children.appendChild(t);
            nodesList.push(a, t);
        });
        setTimeout(draw, 100);
    };

    function createNode(txt, cls, id, act, artId = null) {
        const div = document.createElement('div');
        div.className = `draggable-node ${cls}`;
        div.dataset.nodeId = id;
        if(artId) div.dataset.articleId = artId;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = txt; // 우선 HTML로 해석
        const footnotes = tempDiv.querySelectorAll('.footnote');
        footnotes.forEach(fn => fn.remove());

        div.textContent = tempDiv.textContent;
        
    div.style.display = 'none';
    addBtn(div, act);
    return div;
    }

    function addBtn(parent, type) {
        const btn = document.createElement('div');
        btn.className = 'node-action-btn';
        btn.innerHTML = '&#x25A1;';
        
        btn.onmousedown = (e) => e.stopPropagation();
        btn.ontouchstart = (e) => e.stopPropagation();

        btn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            
            if (type === 'toggle') {
                const isExp = parent.classList.toggle('expanded');
                nodesList.forEach((n, i) => {
                    if (isExp) {
                        n.style.display = 'block';
                        const idx = Math.floor(i/2);
                        n.style.left = `${parent.offsetLeft + 180 + (i%2===1 ? 150 : 0)}px`;
                        n.style.top = `${parent.offsetTop + idx * 60}px`;
                    } else n.style.display = 'none';
                });
            } else if (type === 'intro') {
                const d = data['intro_rekisi'];
                showModal(d.title, "REKISI", null, d.content);
            } else if (type === 'article-modal') {
                const d = data[parent.dataset.articleId];
                // ★ 수정: "글 제목" 클릭 시 저자소개(i) 자리에 null 전달
                showModal(d.title, d.author, null, d.content);
            } else if (type === 'author-modal') {
                const name = parent.dataset.nodeId;
                const d = Object.values(data).find(v => v.author === name);
                // ★ 수정: "저자명" 클릭 시 본문(b) 자리에 빈 배열 전달
                // showModal(`${name}`, d ? d.author_intro : "", []);
                showModal(`${name}`, "Author", introText, []);
            }
            draw();
        };
        parent.appendChild(btn);
    }

    // 드래그 및 선 그리기 로직 (기존과 동일)
    const start = (e) => {
        const node = e.target.closest('.draggable-node');
        if (!node || e.target.closest('.node-action-btn')) return;
        dragged = node;
        const c = e.touches ? e.touches[0] : e;
        offset = { x: c.clientX - node.offsetLeft, y: c.clientY - node.offsetTop };
        node.style.zIndex = 1000;
    };
    const move = (e) => {
        if (!dragged) return;
        const c = e.touches ? e.touches[0] : e;
        dragged.style.left = `${c.clientX - offset.x}px`;
        dragged.style.top = `${c.clientY - offset.y}px`;
        draw();
    };
    const end = () => { if (dragged) dragged.style.zIndex = 30; dragged = null; };

    wrapper.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    wrapper.addEventListener('touchstart', start, {passive: true});
    window.addEventListener('touchmove', move, {passive: false});
    window.addEventListener('touchend', end);

    function draw() {
        linesSvg.innerHTML = '';
        linesSvg.style.width = `${wrapper.scrollWidth}px`;
        linesSvg.style.height = `${wrapper.scrollHeight}px`;
        const getP = (id) => {
            const el = document.querySelector(`[data-node-id="${id}"]`);
            if (!el || el.style.display === 'none') return null;
            return { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        };
        const conns = [{p:'logo', c:'소개', t:'logo'}, {p:'logo', c:'1호', t:'logo'}];
        if (issue1.classList.contains('expanded')) {
            articles.forEach(id => {
                conns.push({p:'1호', c:data[id].author, t:'p'}, {p:data[id].author, c:data[id].title, t:'s'});
            });
        }
        conns.forEach(conn => {
            const p = getP(conn.p), c = getP(conn.c);
            if (p && c) {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                if (conn.t === 's') path.setAttribute('class', 'line-straight');
                const sX = p.x + (conn.t==='logo'?p.w/2:p.w), sY = p.y + (conn.t==='logo'?p.h:p.h/2);
                const eX = c.x, eY = c.y + c.h/2;
                path.setAttribute('d', `M ${sX} ${sY} C ${sX+60} ${sY}, ${eX-60} ${eY}, ${eX} ${eY}`);
                linesSvg.appendChild(path);
            }
        });
    }

    const showModal = (t, m, i, b) => {
        document.getElementById('modal-article-title').innerHTML = t;
        document.getElementById('modal-article-meta').textContent = m || "";
        const introBox = document.getElementById('modal-author-intro');
        
        // 저자 소개가 있을 때만 박스 표시
        introBox.innerHTML = i ? `<strong>저자 소개:</strong> ${i}` : "";
        introBox.style.display = i ? "block" : "none";

        const contentHTML = (b || []).map(p => `<p>${p}</p>`).join('');
        document.getElementById('modal-article-body').innerHTML = contentHTML;
        // 본문 출력
        // document.getElementById('modal-article-body').innerHTML = (b || []).map(p => `<p>${p}</p>`).join('');
        modal.style.display = 'block';
        document.getElementById('article-modal').scrollTop = 0; // 모달 열 때 스크롤 맨 위로
    };

    document.querySelector('.close-btn').onclick = () => modal.style.display = 'none';
    init();
});






