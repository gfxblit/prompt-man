(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();var o=(c=>(c.Empty="Empty",c.Wall="Wall",c.Pellet="Pellet",c.PowerPellet="PowerPellet",c.PacmanSpawn="PacmanSpawn",c.GhostSpawn="GhostSpawn",c))(o||{}),f=(c=>(c.Pacman="Pacman",c.Ghost="Ghost",c))(f||{});const m={"#":o.Wall,".":o.Pellet,o:o.PowerPellet," ":o.Empty,P:o.PacmanSpawn,G:o.GhostSpawn};class u{tiles;width;height;constructor(t,e,r=o.Empty){this.width=t,this.height=e,this.tiles=Array.from({length:e},()=>Array.from({length:t},()=>r))}static fromString(t){const e=t.trim().split(`
`),r=e.length,i=e[0]?.length??0,s=new u(i,r);for(let l=0;l<r;l++){const a=e[l];if(a)for(let d=0;d<i;d++){const g=a[d];if(g===void 0)continue;const P=m[g]||o.Empty;s.setTile(d,l,P)}}return s}getWidth(){return this.width}getHeight(){return this.height}getTile(t,e){if(!this.isOutOfBounds(t,e))return this.tiles[e]?.[t]}setTile(t,e,r){if(this.isOutOfBounds(t,e))return;const i=this.tiles[e];i&&(i[t]=r)}isOutOfBounds(t,e){return t<0||t>=this.width||e<0||e>=this.height}isWalkable(t,e){const r=this.getTile(t,e);return r!==void 0&&r!==o.Wall}}const n=8,h={WALL:"blue",PELLET:"peachpuff",PACMAN:"yellow",GHOST_DEFAULT:"red"},p=`
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
     #.##          ##.#     
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
`.trim();class E{constructor(t){this.ctx=t}render(t,e=[]){const r=t.getWidth(),i=t.getHeight();this.ctx.clearRect(0,0,r*n,i*n);for(let s=0;s<i;s++)for(let l=0;l<r;l++){const a=t.getTile(l,s);a&&this.renderTile(l,s,a)}this.renderEntities(e)}renderTile(t,e,r){const i=t*n,s=e*n;switch(r){case o.Wall:this.ctx.fillStyle=h.WALL,this.ctx.fillRect(i,s,n,n);break;case o.Pellet:this.ctx.fillStyle=h.PELLET,this.ctx.fillRect(i+n/2-1,s+n/2-1,2,2);break;case o.PowerPellet:this.ctx.fillStyle=h.PELLET,this.ctx.beginPath(),this.ctx.arc(i+n/2,s+n/2,3,0,Math.PI*2),this.ctx.fill();break;case o.Empty:case o.PacmanSpawn:case o.GhostSpawn:}}renderEntities(t){for(const e of t)this.renderEntity(e)}renderEntity(t){const e=t.x*n+n/2,r=t.y*n+n/2;switch(t.type){case f.Pacman:this.ctx.fillStyle=h.PACMAN,this.ctx.beginPath(),this.ctx.arc(e,r,n/2-1,.2*Math.PI,1.8*Math.PI),this.ctx.lineTo(e,r),this.ctx.closePath(),this.ctx.fill();break;case f.Ghost:this.ctx.fillStyle=t.color||h.GHOST_DEFAULT,this.ctx.beginPath(),this.ctx.arc(e,r,n/2-1,Math.PI,0),this.ctx.lineTo(e+n/2-1,r+n/2-1),this.ctx.lineTo(e-n/2+1,r+n/2-1),this.ctx.closePath(),this.ctx.fill();break}}}function w(c){const t=u.fromString(p),e=document.createElement("canvas");e.width=t.getWidth()*n,e.height=t.getHeight()*n,e.classList.add("border-2","border-gray-600"),c.appendChild(e);const r=e.getContext("2d");r&&(new E(r).render(t),console.log("Grid rendered to canvas"))}if(typeof document<"u"){const c=document.getElementById("game-container");c&&w(c)}
