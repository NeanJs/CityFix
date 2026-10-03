<script setup lang="ts">
import type { IssueStatus } from '../types/issue'

const props = defineProps<{
  status: IssueStatus
}>()

const labels: Record<IssueStatus, string> = {
  submitted: 'Submitted',
  in_review: 'In review',
  scheduled: 'Scheduled',
  resolved: 'Resolved',
}
</script>

<template>
  <span class="pill" :class="`status-${props.status}`">{{ labels[props.status] }}</span>
</template>

<style scoped>
.pill {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
  white-space: nowrap;
}

.status-submitted {
  color: #0f766e;
  background: rgba(45, 212, 191, 0.18);
  border-color: rgba(45, 212, 191, 0.35);
}

.status-in_review {
  color: #1d4ed8;
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.35);
}

.status-scheduled {
  color: #b45309;
  background: rgba(251, 191, 36, 0.22);
  border-color: rgba(251, 191, 36, 0.4);
}

.status-resolved {
  color: #047857;
  background: rgba(52, 211, 153, 0.2);
  border-color: rgba(52, 211, 153, 0.38);
}

@media (prefers-color-scheme: dark) {
  .status-submitted {
    color: #5eead4;
  }

  .status-in_review {
    color: #93c5fd;
  }

  .status-scheduled {
    color: #fcd34d;
  }

  .status-resolved {
    color: #6ee7b7;
  }
}
</style>
