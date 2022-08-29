<template>
  <footer class="footer flex items-center text-gray-200">
    <div class="w-full max-w-7xl mx-auto py-16 px-2 sm:px-6 lg:px-8">
      <div class="grid grid-cols-none md:grid-cols-4 gap-4">
        <div class="md:col-span-1">
          <div class="flex items-center">
            <div class="w-full">
              <p class="text-yellow-400">Have a question?</p>
              <a href="https://discord.gg/xWRYB9s" target="_blank">Chat with us on Discord</a>
            </div>

            <div class="p-1 text-red-500 text-right">
              <a href="https://discord.gg/xWRYB9s" target="_blank">
                <ChatBubbleLeftRightIcon class="h-12 w-h-12" />
              </a>
            </div>
          </div>

          <div class="flex items-center mt-5">
            <div class="w-full">
              <p class="text-yellow-400">Having issue?</p>
              <a href="https://eng-support.privex.io/open.php" target="_blank"
                >Create a support ticket</a
              >
            </div>

            <div class="p-1 text-red-500 text-right">
              <a href="https://eng-support.privex.io/open.php" target="_blank">
                <UserGroupIcon class="h-12 w-h-12" />
              </a>
            </div>
          </div>
        </div>

        <div class="text-center md:text-left md:col-span-3 md:order-first">
          <img src="/images/logo-large-dark.png" class="block mx-auto md:mx-0 w-56 mt-12" />

          <p class="font-bold mt-5">
            &copy; {{ new Date().getFullYear() }} Hive Engine, all rights reserved.
          </p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ChatBubbleLeftRightIcon, UserGroupIcon } from "@heroicons/vue/24/outline";
</script>
