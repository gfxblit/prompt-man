(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const n of s)if(n.type==="childList")for(const o of n.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function e(s){const n={};return s.integrity&&(n.integrity=s.integrity),s.referrerPolicy&&(n.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?n.credentials="include":s.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(s){if(s.ep)return;s.ep=!0;const n=e(s);fetch(s.href,n)}})();var r=(c=>(c.Empty="Empty",c.Wall="Wall",c.Pellet="Pellet",c.PowerPellet="PowerPellet",c.PacmanSpawn="PacmanSpawn",c.GhostSpawn="GhostSpawn",c))(r||{}),d=(c=>(c.Pacman="Pacman",c.Ghost="Ghost",c))(d||{});const p={"#":r.Wall,".":r.Pellet,o:r.PowerPellet," ":r.Empty,P:r.PacmanSpawn,G:r.GhostSpawn};class P{tiles;width;height;tileCache=new Map;constructor(t,e,i=r.Empty){this.width=t,this.height=e,this.tiles=Array.from({length:e},()=>Array.from({length:t},()=>i)),t>0&&e>0&&this.rebuildCache()}static fromString(t){const e=t.trim();if(!e)return new P(0,0);const i=e.split(`
`),s=i.length,n=i.length>0?Math.max(...i.map(h=>h.length)):0,o=new P(n,s,r.Empty);for(let h=0;h<s;h++){const a=i[h];if(a)for(let u=0;u<n;u++){const g=a[u];if(g===void 0)continue;const m=p[g]||r.Empty;m!==r.Empty&&o.setTile(u,h,m)}}return o}rebuildCache(){this.tileCache.clear();for(let t=0;t<this.height;t++){const e=this.tiles[t];if(e)for(let i=0;i<this.width;i++){const s=e[i];s!==void 0&&(this.tileCache.has(s)||this.tileCache.set(s,[]),this.tileCache.get(s).push({x:i,y:t}))}}}getWidth(){return this.width}getHeight(){return this.height}getTile(t,e){if(!this.isOutOfBounds(t,e))return this.tiles[e]?.[t]}setTile(t,e,i){if(this.isOutOfBounds(t,e))return;const s=this.tiles[e];if(s){const n=s[t];if(n===i)return;if(s[t]=i,n!==void 0){const o=this.tileCache.get(n);if(o){const h=o.findIndex(a=>a.x===t&&a.y===e);h!==-1&&o.splice(h,1)}}this.tileCache.has(i)||this.tileCache.set(i,[]),this.tileCache.get(i).push({x:t,y:e})}}isOutOfBounds(t,e){return t<0||t>=this.width||e<0||e>=this.height}isWalkable(t,e){const i=this.getTile(t,e);return i!==void 0&&i!==r.Wall}findTiles(t){return[...this.tileCache.get(t)||[]]}}const l=8,f={WALL:"blue",PELLET:"peachpuff",PACMAN:"yellow",GHOST_DEFAULT:"red"},w=`
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
`.trim();class E{constructor(t){this.ctx=t}render(t,e){const i=t.getWidth(),s=t.getHeight();this.ctx.clearRect(0,0,i*l,s*l);for(let n=0;n<s;n++)for(let o=0;o<i;o++){const h=t.getTile(o,n);h&&((h===r.Pellet||h===r.PowerPellet)&&e.isPelletEaten(o,n)||this.renderTile(o,n,h))}this.renderEntities(e.getEntities())}renderTile(t,e,i){const s=t*l,n=e*l;switch(i){case r.Wall:this.ctx.fillStyle=f.WALL,this.ctx.fillRect(s,n,l,l);break;case r.Pellet:this.ctx.fillStyle=f.PELLET,this.ctx.fillRect(s+l/2-1,n+l/2-1,2,2);break;case r.PowerPellet:this.ctx.fillStyle=f.PELLET,this.ctx.beginPath(),this.ctx.arc(s+l/2,n+l/2,3,0,Math.PI*2),this.ctx.fill();break;case r.Empty:case r.PacmanSpawn:case r.GhostSpawn:}}renderEntities(t){for(const e of t)this.renderEntity(e)}renderEntity(t){const e=t.x*l+l/2,i=t.y*l+l/2;switch(t.type){case d.Pacman:this.ctx.fillStyle=f.PACMAN,this.ctx.beginPath(),this.ctx.arc(e,i,l/2-1,.2*Math.PI,1.8*Math.PI),this.ctx.lineTo(e,i),this.ctx.closePath(),this.ctx.fill();break;case d.Ghost:this.ctx.fillStyle=t.color||f.GHOST_DEFAULT,this.ctx.beginPath(),this.ctx.arc(e,i,l/2-1,Math.PI,0),this.ctx.lineTo(e+l/2-1,i+l/2-1),this.ctx.lineTo(e-l/2+1,i+l/2-1),this.ctx.closePath(),this.ctx.fill();break}}}class x{constructor(t){this.grid=t,this.initialize()}entities=[];score=0;remainingPellets=0;eatenPellets=new Set;initialize(){const t=this.grid.findTiles(r.PacmanSpawn);for(const n of t)this.entities.push({type:d.Pacman,x:n.x,y:n.y});const e=this.grid.findTiles(r.GhostSpawn);for(const n of e)this.entities.push({type:d.Ghost,x:n.x,y:n.y});const i=this.grid.findTiles(r.Pellet),s=this.grid.findTiles(r.PowerPellet);this.remainingPellets=i.length+s.length}getEntities(){return this.entities}getScore(){return this.score}getRemainingPellets(){return this.remainingPellets}isPelletEaten(t,e){return this.eatenPellets.has(`${t},${e}`)}consumePellet(t,e){if(this.isPelletEaten(t,e))return;const i=this.grid.getTile(t,e);(i===r.Pellet||i===r.PowerPellet)&&(this.eatenPellets.add(`${t},${e}`),this.remainingPellets--,this.score+=i===r.Pellet?10:50)}}function S(c){const t=P.fromString(w),e=new x(t),i=document.createElement("canvas");i.width=t.getWidth()*l,i.height=t.getHeight()*l,i.classList.add("border-2","border-gray-600"),c.appendChild(i);const s=i.getContext("2d");s&&new E(s).render(t,e)}if(typeof document<"u"){const c=document.getElementById("game-container");c&&S(c)}
