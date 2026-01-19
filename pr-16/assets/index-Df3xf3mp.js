(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&i(c)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();var r=(o=>(o.Empty="Empty",o.Wall="Wall",o.Pellet="Pellet",o.PowerPellet="PowerPellet",o.PacmanSpawn="PacmanSpawn",o.GhostSpawn="GhostSpawn",o))(r||{}),f=(o=>(o.Pacman="Pacman",o.Ghost="Ghost",o))(f||{});const m={"#":r.Wall,".":r.Pellet,o:r.PowerPellet," ":r.Empty,P:r.PacmanSpawn,G:r.GhostSpawn};class u{tiles;width;height;constructor(t,e,i=r.Empty){this.width=t,this.height=e,this.tiles=Array.from({length:e},()=>Array.from({length:t},()=>i))}static fromString(t){const e=t.trim().split(`
`),i=e.length,s=e[0]?.length??0,n=new u(s,i);for(let c=0;c<i;c++){const h=e[c];if(h)for(let d=0;d<s;d++){const P=h[d];if(P===void 0)continue;const g=m[P]||r.Empty;n.setTile(d,c,g)}}return n}getWidth(){return this.width}getHeight(){return this.height}getTile(t,e){if(!this.isOutOfBounds(t,e))return this.tiles[e]?.[t]}setTile(t,e,i){if(this.isOutOfBounds(t,e))return;const s=this.tiles[e];s&&(s[t]=i)}isOutOfBounds(t,e){return t<0||t>=this.width||e<0||e>=this.height}isWalkable(t,e){const i=this.getTile(t,e);return i!==void 0&&i!==r.Wall}findTiles(t){const e=[];for(let i=0;i<this.height;i++)for(let s=0;s<this.width;s++)this.tiles[i]?.[s]===t&&e.push({x:s,y:i});return e}}const l=8,a={WALL:"blue",PELLET:"peachpuff",PACMAN:"yellow",GHOST_DEFAULT:"red"},p=`
############################
#............##............#
#.####.#####.##.#####.####.#
#o####.#####.##.#####.####o#
#.####.#####.##.#####.####.#
#..........................#
#.####.##.########.##.####.#
#.####.##.########.##.####.#
#......##....##....##......#
######.##### ## #####.######
     #.##### ## #####.#     
     #.##    G     ##.#     
     #.## ######## ##.#     
######.## #      # ##.######
      .   #      #   .      
######.## #      # ##.######
     #.## ######## ##.#     
     #.##    P     ##.#     
     #.## ######## ##.#     
######.## ######## ##.######
#............##............#
#.####.#####.##.#####.####.#
#.####.#####.##.#####.####.#
#o..##................##..o#
###.##.##.########.##.##.###
###.##.##.########.##.##.###
#......##....##....##......#
#.##########.##.##########.#
#.##########.##.##########.#
#..........................#
############################
`.trim();class w{constructor(t){this.ctx=t}render(t,e){const i=t.getWidth(),s=t.getHeight();this.ctx.clearRect(0,0,i*l,s*l);for(let n=0;n<s;n++)for(let c=0;c<i;c++){const h=t.getTile(c,n);h&&((h===r.Pellet||h===r.PowerPellet)&&e.isPelletEaten(c,n)||this.renderTile(c,n,h))}this.renderEntities(e.getEntities())}renderTile(t,e,i){const s=t*l,n=e*l;switch(i){case r.Wall:this.ctx.fillStyle=a.WALL,this.ctx.fillRect(s,n,l,l);break;case r.Pellet:this.ctx.fillStyle=a.PELLET,this.ctx.fillRect(s+l/2-1,n+l/2-1,2,2);break;case r.PowerPellet:this.ctx.fillStyle=a.PELLET,this.ctx.beginPath(),this.ctx.arc(s+l/2,n+l/2,3,0,Math.PI*2),this.ctx.fill();break;case r.Empty:case r.PacmanSpawn:case r.GhostSpawn:}}renderEntities(t){for(const e of t)this.renderEntity(e)}renderEntity(t){const e=t.x*l+l/2,i=t.y*l+l/2;switch(t.type){case f.Pacman:this.ctx.fillStyle=a.PACMAN,this.ctx.beginPath(),this.ctx.arc(e,i,l/2-1,.2*Math.PI,1.8*Math.PI),this.ctx.lineTo(e,i),this.ctx.closePath(),this.ctx.fill();break;case f.Ghost:this.ctx.fillStyle=t.color||a.GHOST_DEFAULT,this.ctx.beginPath(),this.ctx.arc(e,i,l/2-1,Math.PI,0),this.ctx.lineTo(e+l/2-1,i+l/2-1),this.ctx.lineTo(e-l/2+1,i+l/2-1),this.ctx.closePath(),this.ctx.fill();break}}}class E{constructor(t){this.grid=t,this.initialize()}entities=[];score=0;remainingPellets=0;eatenPellets=new Set;initialize(){const t=this.grid.findTiles(r.PacmanSpawn);for(const n of t)this.entities.push({type:f.Pacman,x:n.x,y:n.y});const e=this.grid.findTiles(r.GhostSpawn);for(const n of e)this.entities.push({type:f.Ghost,x:n.x,y:n.y});const i=this.grid.findTiles(r.Pellet),s=this.grid.findTiles(r.PowerPellet);this.remainingPellets=i.length+s.length}getEntities(){return this.entities}getScore(){return this.score}getRemainingPellets(){return this.remainingPellets}isPelletEaten(t,e){return this.eatenPellets.has(`${t},${e}`)}consumePellet(t,e){if(this.isPelletEaten(t,e))return;const i=this.grid.getTile(t,e);(i===r.Pellet||i===r.PowerPellet)&&(this.eatenPellets.add(`${t},${e}`),this.remainingPellets--,this.score+=i===r.Pellet?10:50)}}function x(o){const t=u.fromString(p),e=new E(t),i=document.createElement("canvas");i.width=t.getWidth()*l,i.height=t.getHeight()*l,i.classList.add("border-2","border-gray-600"),o.appendChild(i);const s=i.getContext("2d");s&&new w(s).render(t,e)}if(typeof document<"u"){const o=document.getElementById("game-container");o&&x(o)}
