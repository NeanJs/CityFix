<script setup lang="ts">
import { citizenNavItems } from '../../config/nav'
import WorkspaceLayout from './WorkspaceLayout.vue'
</script>

<template>
  <WorkspaceLayout
    :items="citizenNavItems"
    section-key="nav.workspace"
    tagline-key="nav.citizenTagline"
    nav-aria-key="nav.citizenNav"
    :can-manage-status="false"
  />
</template>
