(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const n of e)if(n.type==="childList")for(const l of n.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&o(l)}).observe(document,{childList:!0,subtree:!0});function r(e){const n={};return e.integrity&&(n.integrity=e.integrity),e.referrerPolicy&&(n.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?n.credentials="include":e.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(e){if(e.ep)return;e.ep=!0;const n=r(e);fetch(e.href,n)}})();var s=(i=>(i.Empty="Empty",i.Wall="Wall",i.Pellet="Pellet",i.PowerPellet="PowerPellet",i.PacmanSpawn="PacmanSpawn",i.GhostSpawn="GhostSpawn",i))(s||{});class f{tiles;width;height;constructor(t,r,o=s.Empty){this.width=t,this.height=r,this.tiles=Array.from({length:r},()=>Array.from({length:t},()=>o))}static fromString(t){const r=t.trim().split(`
`),o=r.length,e=r[0]?.length??0,n=new f(e,o),l={"#":s.Wall,".":s.Pellet,o:s.PowerPellet," ":s.Empty,P:s.PacmanSpawn,G:s.GhostSpawn};for(let c=0;c<o;c++){const a=r[c];if(a)for(let u=0;u<e;u++){const h=a[u];if(h===void 0)continue;const m=l[h]||s.Empty;n.setTile(u,c,m)}}return n}getWidth(){return this.width}getHeight(){return this.height}getTile(t,r){if(!this.isOutOfBounds(t,r))return this.tiles[r]?.[t]}setTile(t,r,o){if(this.isOutOfBounds(t,r))return;const e=this.tiles[r];e&&(e[t]=o)}isOutOfBounds(t,r){return t<0||t>=this.width||r<0||r>=this.height}isWalkable(t,r){const o=this.getTile(t,r);return o!==void 0&&o!==s.Wall}}const d=`
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
`.trim();function p(i){const t=f.fromString(d);return i&&(i.textContent=d),t}if(typeof document<"u"){const i=document.getElementById("output");i&&p(i)}
