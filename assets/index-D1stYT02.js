(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&n(l)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function n(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();var o=(c=>(c.Empty="Empty",c.Wall="Wall",c.Pellet="Pellet",c.PowerPellet="PowerPellet",c.PacmanSpawn="PacmanSpawn",c.GhostSpawn="GhostSpawn",c))(o||{}),f=(c=>(c.Pacman="Pacman",c.Ghost="Ghost",c))(f||{});class d{tiles;width;height;constructor(t,e,n=o.Empty){this.width=t,this.height=e,this.tiles=Array.from({length:e},()=>Array.from({length:t},()=>n))}static fromString(t){const e=t.trim().split(`
`),n=e.length,i=e[0]?.length??0,r=new d(i,n),l={"#":o.Wall,".":o.Pellet,o:o.PowerPellet," ":o.Empty,P:o.PacmanSpawn,G:o.GhostSpawn};for(let h=0;h<n;h++){const u=e[h];if(u)for(let a=0;a<i;a++){const g=u[a];if(g===void 0)continue;const p=l[g]||o.Empty;r.setTile(a,h,p)}}return r}getWidth(){return this.width}getHeight(){return this.height}getTile(t,e){if(!this.isOutOfBounds(t,e))return this.tiles[e]?.[t]}setTile(t,e,n){if(this.isOutOfBounds(t,e))return;const i=this.tiles[e];i&&(i[t]=n)}isOutOfBounds(t,e){return t<0||t>=this.width||e<0||e>=this.height}isWalkable(t,e){const n=this.getTile(t,e);return n!==void 0&&n!==o.Wall}}const s=8;class P{constructor(t){this.ctx=t}render(t,e=[]){const n=t.getWidth(),i=t.getHeight();this.ctx.clearRect(0,0,n*s,i*s);for(let r=0;r<i;r++)for(let l=0;l<n;l++){const h=t.getTile(l,r);h&&this.renderTile(l,r,h)}this.renderEntities(e)}renderTile(t,e,n){const i=t*s,r=e*s;switch(n){case o.Wall:this.ctx.fillStyle="blue",this.ctx.fillRect(i,r,s,s);break;case o.Pellet:this.ctx.fillStyle="peachpuff",this.ctx.fillRect(i+s/2-1,r+s/2-1,2,2);break;case o.PowerPellet:this.ctx.fillStyle="peachpuff",this.ctx.beginPath(),this.ctx.arc(i+s/2,r+s/2,3,0,Math.PI*2),this.ctx.fill();break;case o.Empty:case o.PacmanSpawn:case o.GhostSpawn:}}renderEntities(t){for(const e of t)this.renderEntity(e)}renderEntity(t){const e=t.x*s+s/2,n=t.y*s+s/2;switch(t.type){case f.Pacman:this.ctx.fillStyle="yellow",this.ctx.beginPath(),this.ctx.arc(e,n,s/2-1,.2*Math.PI,1.8*Math.PI),this.ctx.lineTo(e,n),this.ctx.closePath(),this.ctx.fill();break;case f.Ghost:this.ctx.fillStyle=t.color||"red",this.ctx.beginPath(),this.ctx.arc(e,n,s/2-1,Math.PI,0),this.ctx.lineTo(e+s/2-1,n+s/2-1),this.ctx.lineTo(e-s/2+1,n+s/2-1),this.ctx.closePath(),this.ctx.fill();break}}}const w=`
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
`.trim();function m(c){const t=d.fromString(w),e=document.createElement("canvas");e.width=t.getWidth()*s,e.height=t.getHeight()*s,c.appendChild(e);const n=e.getContext("2d");n&&(new P(n).render(t),console.log("Grid rendered to canvas"))}if(typeof document<"u"){const c=document.getElementById("output");c&&m(c)}const x=document.getElementById("game-container");m(x);
