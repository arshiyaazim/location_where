module.exports = {
  apps: [
    {
      name: "locationwhere-backend",
      cwd: "/home/azim/locationwhere-backend",
      script: "dist/app.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 8310
      }
    }
  ]
};
