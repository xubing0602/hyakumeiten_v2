Hyakumeiten Map

This is a small static site that displays restaurants from `tabelog_hyakumeiten_output.csv` on a map.

How to use

- Open `index.html` in a static host (GitHub Pages is recommended and free).
- The site parses the CSV client-side (PapaParse), shows clustered markers (Leaflet + MarkerCluster), supports filtering by prefecture and genre, approximate price, and geolocation.

Notes & performance tips

- Images are lazy-loaded when a popup opens to save bandwidth.
- Marker clustering reduces rendering cost for many points.
- For even better performance, pre-convert CSV to compact JSON and gzip it on the server, or host images on a CDN.

Optional: Google Maps

- If you prefer Google Maps, replace the Leaflet tile layer and marker code with Google Maps JS API. Google requires an API key and may incur costs beyond the free tier.

部署到 GitHub Pages

- 方法概要：我已为仓库添加自动部署工作流，推送到 `main` 分支后，GitHub Actions 会将仓库内容发布到 GitHub Pages。
- 我已新增文件：`.gitignore`、`.github/workflows/pages.yml`（见仓库根目录）。

快速推送命令（在你确认要将仓库发布到 GitHub 之后运行）：

1) 使用 GitHub CLI （如果已安装）：

```bash
gh repo create <USERNAME>/<REPO_NAME> --public --source=. --remote=origin --push
```

2) 或者手动：

```bash
git remote add origin git@github.com:<USERNAME>/<REPO_NAME>.git
git push -u origin main
```

注意：如果你更喜欢我代为创建远程仓库（需要你在本机安装并登录 `gh`，或提供受权方法），我可以继续操作。

