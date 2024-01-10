<template>
  <footer class="footer flex items-center text-gray-200">
    <div class="mx-auto w-full max-w-7xl px-2 py-16 sm:px-6 lg:px-8">
      <div class="grid grid-cols-none gap-4 md:grid-cols-4">
        <div class="md:col-span-1">
          <div class="flex items-center">
            <div class="w-full">
              <p class="text-yellow-400">Have a question?</p>
              <a href="https://discord.gg/xWRYB9s" target="_blank">Chat with us on Discord</a>
            </div>

            <div class="p-1 text-right text-red-500">
              <a href="https://discord.gg/xWRYB9s" target="_blank">
                <ChatBubbleLeftRightIcon class="w-h-12 h-12" />
              </a>
            </div>
          </div>

          <div class="mt-5 flex items-center">
            <div class="w-full">
              <p class="text-yellow-400">Having issue?</p>
              <a href="https://eng-support.privex.io/open.php" target="_blank">Create a support ticket</a>
            </div>

            <div class="p-1 text-right text-red-500">
              <a href="https://eng-support.privex.io/open.php" target="_blank">
                <UserGroupIcon class="w-h-12 h-12" />
              </a>
            </div>
          </div>
        </div>

        <div class="text-center md:order-first md:col-span-3 md:text-left">
          <img src="/images/logo-large-dark.png" class="mx-auto mt-12 block w-56 md:mx-0" />

          <p class="mt-5 font-bold">&copy; {{ new Date().getFullYear() }} Hive Engine, all rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ChatBubbleLeftRightIcon, UserGroupIcon } from '@heroicons/vue/24/outline';
</script>
