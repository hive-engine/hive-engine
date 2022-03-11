export default new Promise((res) => {
  const script = document.createElement("script");
  script.onload = () => res();
  script.setAttribute("src", "/scripts/ethers-5.2.umd.min.js");

  document.head.appendChild(script);
});
