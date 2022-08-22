/**
 * 由于React Router Dom V6的useBlocker()和usePrompt()Hook尚在测试中，
 * 降级使用V5也不现实，
 * 因此从GitHub上找到了TS的实现
 */
import type { Blocker, History, Transition } from 'history'
import { ContextType, useCallback, useContext, useEffect } from 'react'
import {
  Navigator as BaseNavigator,
  UNSAFE_NavigationContext as NavigationContext,
} from 'react-router-dom'

interface Navigator extends BaseNavigator {
  block: History['block']
}

type NavigationContextWithBlock = ContextType<typeof NavigationContext> & {
  navigator: Navigator
}

/**
 * @source https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874
 */
function useBlocker(blocker: Blocker, when = true) {
  const { navigator } = useContext(
    NavigationContext
  ) as NavigationContextWithBlock

  useEffect(() => {
    if (!when) {
      return
    }

    const unblock = navigator.block((tx: Transition) => {
      const autoUnblockingTx = {
        ...tx,
        retry() {
          // Automatically unblock the transition so it can play all the way
          // through before retrying it.
          // this block if the transition is cancelled for some reason.
          unblock()
          tx.retry()
        },
      }

      blocker(autoUnblockingTx)
    })

    return unblock
  }, [navigator, blocker, when])
}

/**
 * @source https://github.com/remix-run/react-router/issues/8139#issuecomment-1021457943
 */
export function usePrompt(
  message:
    | string
    | ((
        location: Transition['location'],
        action: Transition['action']
      ) => string),
  when = true
) {
  const blocker = useCallback(
    (tx: Transition) => {
      let response
      if (typeof message === 'function') {
        response = message(tx.location, tx.action)
        if (typeof response === 'string') {
          response = window.confirm(response)
        }
      } else {
        response = window.confirm(message)
      }
      if (response) {
        tx.retry()
      }
    },
    [message]
  )
  return useBlocker(blocker, when)
}
