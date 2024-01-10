<template>
  <div
    class="flex flex-col items-center justify-center rounded-full border-2 border-white border-opacity-50 bg-gray-800"
  >
    <template v-if="color === 'Black'">
      <svg xmlns="http://www.w3.org/2000/svg" width="18.785" height="19.098" viewBox="0 0 18.785 19.098">
        <defs>
          <radialGradient id="deathElement" cx=".5" cy=".5" r=".5" gradientUnits="objectBoundingBox">
            <stop offset="0" stop-color="#e784ff" />
            <stop offset="1" stop-color="#9b00e0" />
          </radialGradient>
        </defs>
        <path
          d="M13.948.933 12.7 2.574l-2.191.1-1.047 1.883.626-2.435 1.6-.244.3-1.59A11.707 11.707 0 0 0 9.392 0C4.205 0 0 3.333 0 7.444a6.963 6.963 0 0 0 3.427 5.75l1.252 3.747 1.687.383.921-2.694.54 4.086 1.635.383.133-4.509 1.259 4.439 1.565-.9.293-3.535.716 2.561 2.372-2.4.189-2.006a6.766 6.766 0 0 0 2.8-5.3C18.785 4.643 16.832 2.2 13.948.933ZM4.324 8.718s-3.068.052-1.456-3.9a5.812 5.812 0 0 1 3.9 1.352C8.224 7.626 8.276 8.614 9 8.562a3.4 3.4 0 0 1-1.872 0 7.1 7.1 0 0 0-2.808.156Zm5.358 3.309a7.349 7.349 0 0 0-2.419 1.653s1.3-2.714 2.419-3.245c0 0 1.829 1.475 2.006 2.36a16.444 16.444 0 0 0-2.006-.767Zm4.778-3.309a7.1 7.1 0 0 0-2.808-.156 3.4 3.4 0 0 1-1.872 0c.728.052.78-.936 2.236-2.392a5.812 5.812 0 0 1 3.9-1.352c1.612 3.951-1.456 3.9-1.456 3.9Z"
          style="fill: url(#deathElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'Gold'">
      <svg xmlns="http://www.w3.org/2000/svg" width="18.914" height="18.169" viewBox="0 0 18.914 18.169">
        <defs>
          <radialGradient id="dragonElement" cx=".5" cy=".5" r=".5" gradientUnits="objectBoundingBox">
            <stop offset="0" stop-color="#fff8a3" />
            <stop offset="1" stop-color="#ffb100" />
          </radialGradient>
        </defs>
        <path
          d="M62.187 60.125c-2.354 7.4-3.71 11.114-3.71 11.114-1.929-6.139-.264-10.539 1.733-13.326a37.454 37.454 0 0 0-4.446-4.173 9.72 9.72 0 1 0 14 11.6c-1.988-.474-4.508-1.917-7.577-5.215Z"
          transform="translate(-50.847 -53.74)"
          style="fill: url(#dragonElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'Green'">
      <svg xmlns="http://www.w3.org/2000/svg" width="19.44" height="17.457" viewBox="0 0 19.44 17.457">
        <defs>
          <radialGradient
            id="earthElement"
            cx=".722"
            cy=".23"
            r=".993"
            gradientTransform="matrix(-.579 .776 -.712 -.631 1.303 -.185)"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#aaff9a" />
            <stop offset="1" stop-color="#1ba200" />
          </radialGradient>
        </defs>
        <path
          d="M16.2 42.382s-.35.048-.835.063q-.121.07-.25.142a31.331 31.331 0 0 0-2.668 1.665c.817.659 1.8 2.295 1.78 6.355 0 0-.489-4.049-3.129-5.367a36.103 36.103 0 0 0-2.271 1.908 8.794 8.794 0 0 1-.382 6.2c.5-3.28-.13-4.695-.6-5.27a35.542 35.542 0 0 0-5.271 6.444 54.452 54.452 0 0 1 3.3-5.8Q6.435 47.848 7 47.07c-1.078-1.411-3.935-.384-3.962-.374a3.933 3.933 0 0 1 4.53-.385A33.848 33.848 0 0 1 9.8 43.7c-.356-2.069-3.2-2.016-3.2-2.016 1.81-.809 3.417.367 4.149 1.058a28.242 28.242 0 0 1 1.736-1.554v-.105s-3.091-4.822-7.786-.352a12.6 12.6 0 0 0-2.67 8.226A10.2 10.2 0 0 1 0 56.232s5 .763 14.124-3.4 4.186-10.567 2.076-10.45Z"
          transform="translate(0 -38.83)"
          style="fill: url(#earthElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'Red'">
      <svg xmlns="http://www.w3.org/2000/svg" width="14.511" height="19.095" viewBox="0 0 14.511 19.095">
        <defs>
          <radialGradient
            id="fireElement"
            cx=".5"
            cy=".856"
            r=".72"
            gradientTransform="matrix(.105 -.997 1.168 .071 -.552 1.294)"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#ffa279" />
            <stop offset="1" stop-color="#ff0010" />
          </radialGradient>
        </defs>
        <path
          d="M13.752 208.967a2.9 2.9 0 0 1-1.657 2.563c1.272-2.283-.515-5.517-2.059-6.349a2.948 2.948 0 0 1-1.642-3.642c-1.659 1.562.315 2.231 1.5 5.593a3.421 3.421 0 0 1-1.742 4.461c1.287-1.391 1.119-3.482-.579-4.064-1.1-.376-4.256-2.329-3.149-3.911a6.809 6.809 0 0 0 .876-3.968c0 1.754-2.876 2.531-3.034 4.141s2.229 2.243 2.631 3.681-1.165 2.507-2.372 2.933a3.068 3.068 0 0 0-2.516 3.221c-.158 2.631 3.336 2.9 4.314 3.681s.748 1.438.748 1.438a1.291 1.291 0 0 1 1.153-.424 8.343 8.343 0 0 0 6.554-1.129c3.217-2.243.974-8.225.974-8.225ZM6.5 217.882s.2-.906-1.078-.259a3.391 3.391 0 0 0-.82-2.761c-1.107-1.078-1.869-2.732-.733-3.106s2.674-.345 2.8-1.725c0 0 .546 2.459-.561 3.451s.216 2.027.216 2.027a1.048 1.048 0 0 1 .3.733v.23s1.346.143 1.251-1.093c-.216-2.8.834-4.141 3.106-4.357 0 0-2.387.536-2.718 4.443-.086 1.021.489.719-.216 1.682 0 0 2.631-.82 3.58-2.674 0 0 .345 4.084-5.133 3.408Z"
          transform="translate(0 -199.65)"
          style="fill: url(#fireElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'White'">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24.88 24.827" preserveAspectRatio="xMaxYMax meet">
        <defs>
          <radialGradient id="lifeElement" cx=".5" cy=".5" r=".5" gradientUnits="objectBoundingBox">
            <stop offset="0" stop-color="#fff" />
            <stop offset="1" stop-color="#c9c9c9" />
          </radialGradient>
        </defs>
        <path
          d="m24.88 12.445-4.718-.781a7.83 7.83 0 0 0-6.966-7.1L12.44 0l-.753 4.548a7.829 7.829 0 0 0-7.139 7.144L0 12.445l4.565.756a7.83 7.83 0 0 0 7.1 6.96l.778 4.666.781-4.683a7.831 7.831 0 0 0 6.923-6.915Zm-5.019-.831-3.868-.641 1.817-3.821a7.519 7.519 0 0 1 2.052 4.462Zm-2.126-4.539-3.823 1.817-.666-4.026a7.525 7.525 0 0 1 4.489 2.209Zm-6.1-2.226-.669 4.044-3.935-1.872a7.522 7.522 0 0 1 4.606-2.172Zm-4.62 2.187 1.872 3.937-4.039.669a7.522 7.522 0 0 1 2.167-4.606Zm-2.148 6.215 4.02.666-1.814 3.816a7.526 7.526 0 0 1-2.206-4.482Zm2.287 4.56L10.968 16l.644 3.863a7.518 7.518 0 0 1-4.458-2.049Zm6.117 2.031L13.912 16l3.7 1.76a7.523 7.523 0 0 1-4.341 2.082Zm4.481-2.223-1.76-3.7 3.848-.637a7.523 7.523 0 0 1-2.088 4.339Z"
          style="fill: url(#lifeElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'Gray'">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22.89"
        height="19.96"
        viewBox="0 0 22.89 19.96"
        preserveAspectRatio="xMaxYMax meet"
      >
        <defs>
          <radialGradient
            id="neutralElement"
            cx=".5"
            cy=".5"
            r=".641"
            gradientTransform="matrix(.644 -.675 .588 .738 -.116 .468)"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#b4d1ff" />
            <stop offset="1" stop-color="#4d6ea0" />
          </radialGradient>
        </defs>
        <path
          d="m22.667 17.771-.8-.806a.8.8 0 0 0-1.117 0l-2.588-4.054L19.8 11.27a.717.717 0 0 0 .166-.971l-1.11-1.11a.723.723 0 0 0-.974.163l-.551.554a3.6 3.6 0 0 1-.616 2.329L14.222 8.9l5.085-3.8.655-5.1-5.1.653-3.411 4.556L8.04.653 2.94 0l.653 5.1L8.68 8.9l-2.5 3.335a3.6 3.6 0 0 1-.616-2.329l-.554-.554a.719.719 0 0 0-.972-.163L2.93 10.3a.72.72 0 0 0 .163.971l1.641 1.641-2.578 4.043a.8.8 0 0 0-1.117 0l-.806.816a.8.8 0 0 0 0 1.13l.826.828a.808.808 0 0 0 1.132 0l.8-.806a.8.8 0 0 0 .016-1.123l4.044-2.581 1.641 1.639a.717.717 0 0 0 .972.166l1.11-1.11a.718.718 0 0 0-.166-.971l-.551-.554a3.6 3.6 0 0 1-2.329-.616l3.723-2.788 3.723 2.788a3.6 3.6 0 0 1-2.319.616l-.554.554a.719.719 0 0 0-.163.971l1.11 1.11a.718.718 0 0 0 .972-.166l1.641-1.639L19.9 17.8a.8.8 0 0 0 0 1.117l.806.806a.8.8 0 0 0 1.13 0l.826-.828a.8.8 0 0 0 .005-1.124Z"
          transform="translate(-.001)"
          style="fill: url(#neutralElement)"
        />
      </svg>
    </template>

    <template v-else-if="color === 'Blue'">
      <svg xmlns="http://www.w3.org/2000/svg" width="16.929" height="20.519" viewBox="0 0 16.929 20.519">
        <defs>
          <radialGradient
            id="waterElement"
            cx=".5"
            cy=".119"
            r=".787"
            gradientTransform="matrix(-.27 .975 -1.215 -.229 .78 -.341)"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0" stop-color="#9bfaff" />
            <stop offset="1" stop-color="#00b3be" />
          </radialGradient>
        </defs>
        <path
          d="M30.637 120.748a2.383 2.383 0 0 0 .019-.3 2.423 2.423 0 0 0-2.259-2.418 2.426 2.426 0 0 0-2.954-1.679 2.422 2.422 0 0 0-2.06-1.147 2.46 2.46 0 0 0-.369.028c-.138.031-.275.064-.411.1a2.4 2.4 0 0 0-.4.18l-.059-.045a2.424 2.424 0 0 0-3.8 1.435 2.348 2.348 0 0 1-.046.31q-.009.1-.009.207a2.414 2.414 0 0 0 .018.292q-.214.2-.415.406a2.457 2.457 0 0 1-.374.408 10.27 10.27 0 0 0 9.729 16.8 6.347 6.347 0 0 1-.149-12.272 2.424 2.424 0 1 0 3.551-2.31Zm-7.693 13.326c-11.866-7.67-3.3-14.376-3.3-14.376-5.916 7.739 3.3 14.376 3.3 14.376-9.974-8.977-.619-14.548-.619-14.548-7.016 7.257.619 14.548.619 14.548s-7.429-8.22 1.307-12.932c.001 0-6.397 5.503-1.306 12.932Z"
          transform="translate(-15 -114.999)"
          style="fill: url(#waterElement)"
        />
      </svg>
    </template>
  </div>
</template>

<script setup>
defineProps({
  color: { type: String, required: true },
});
</script>
