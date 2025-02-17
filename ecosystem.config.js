module.exports = {
  apps: [
    {
      name: "ORIONt",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000", //running on port 3000
      cwd: "./",
      instances: 1,
      watch: false,
    },
  ],
};
