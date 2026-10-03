<script setup lang="ts">
import { staffNavItems } from '../../config/nav'
import WorkspaceLayout from './WorkspaceLayout.vue'
</script>

<template>
  <WorkspaceLayout
    :items="staffNavItems"
    section-key="nav.operations"
    tagline-key="nav.staffTagline"
    nav-aria-key="nav.staffNav"
    :can-manage-status="true"
  />
</template>
