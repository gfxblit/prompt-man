(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const l of s.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();var o=(c=>(c.Empty="Empty",c.Wall="Wall",c.Pellet="Pellet",c.PowerPellet="PowerPellet",c.PacmanSpawn="PacmanSpawn",c.GhostSpawn="GhostSpawn",c))(o||{}),f=(c=>(c.Pacman="Pacman",c.Ghost="Ghost",c))(f||{});const p={"#":o.Wall,".":o.Pellet,o:o.PowerPellet," ":o.Empty,P:o.PacmanSpawn,G:o.GhostSpawn};class u{tiles;width;height;constructor(t,e,n=o.Empty){this.width=t,this.height=e,this.tiles=Array.from({length:e},()=>Array.from({length:t},()=>n))}static fromString(t){const e=t.trim().split(`
`),n=e.length,i=e[0]?.length??0,s=new u(i,n);for(let l=0;l<n;l++){const h=e[l];if(h)for(let d=0;d<i;d++){const g=h[d];if(g===void 0)continue;const m=p[g]||o.Empty;s.setTile(d,l,m)}}return s}getWidth(){return this.width}getHeight(){return this.height}getTile(t,e){if(!this.isOutOfBounds(t,e))return this.tiles[e]?.[t]}setTile(t,e,n){if(this.isOutOfBounds(t,e))return;const i=this.tiles[e];i&&(i[t]=n)}isOutOfBounds(t,e){return t<0||t>=this.width||e<0||e>=this.height}isWalkable(t,e){const n=this.getTile(t,e);return n!==void 0&&n!==o.Wall}}const r=8,a={WALL:"blue",PELLET:"peachpuff",PACMAN:"yellow",GHOST_DEFAULT:"red"},E=`
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
`.trim();class w{constructor(t){this.ctx=t}render(t,e=[]){const n=t.getWidth(),i=t.getHeight();this.ctx.clearRect(0,0,n*r,i*r);for(let s=0;s<i;s++)for(let l=0;l<n;l++){const h=t.getTile(l,s);h&&this.renderTile(l,s,h)}this.renderEntities(e)}renderTile(t,e,n){const i=t*r,s=e*r;switch(n){case o.Wall:this.ctx.fillStyle=a.WALL,this.ctx.fillRect(i,s,r,r);break;case o.Pellet:this.ctx.fillStyle=a.PELLET,this.ctx.fillRect(i+r/2-1,s+r/2-1,2,2);break;case o.PowerPellet:this.ctx.fillStyle=a.PELLET,this.ctx.beginPath(),this.ctx.arc(i+r/2,s+r/2,3,0,Math.PI*2),this.ctx.fill();break;case o.Empty:case o.PacmanSpawn:case o.GhostSpawn:}}renderEntities(t){for(const e of t)this.renderEntity(e)}renderEntity(t){const e=t.x*r+r/2,n=t.y*r+r/2;switch(t.type){case f.Pacman:this.ctx.fillStyle=a.PACMAN,this.ctx.beginPath(),this.ctx.arc(e,n,r/2-1,.2*Math.PI,1.8*Math.PI),this.ctx.lineTo(e,n),this.ctx.closePath(),this.ctx.fill();break;case f.Ghost:this.ctx.fillStyle=t.color||a.GHOST_DEFAULT,this.ctx.beginPath(),this.ctx.arc(e,n,r/2-1,Math.PI,0),this.ctx.lineTo(e+r/2-1,n+r/2-1),this.ctx.lineTo(e-r/2+1,n+r/2-1),this.ctx.closePath(),this.ctx.fill();break}}}function P(c){const t=u.fromString(E),e=document.createElement("canvas");e.width=t.getWidth()*r,e.height=t.getHeight()*r,c.appendChild(e);const n=e.getContext("2d");n&&(new w(n).render(t),console.log("Grid rendered to canvas"))}if(typeof document<"u"){const c=document.getElementById("output");c&&P(c)}const x=document.getElementById("game-container");P(x);
