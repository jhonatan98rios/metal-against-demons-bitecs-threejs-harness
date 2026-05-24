export default {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'ecs-no-rendering',
      severity: 'error',
      from: {
        path: '^src/game/core'
      },
      to: {
        path: '^src/game/rendering'
      }
    }
  ]
}
