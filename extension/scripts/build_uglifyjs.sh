#!/bin/bash

if [ -z "$NODE_ENV" ]; then
  echo "--> NODE_ENV not specified; assuming \"development\""
  NODE_ENV=development
fi

if [ "$NODE_ENV" = "development" ]; then
  if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL=`curl -s http://localhost:4040/api/tunnels | perl -nle 'print "$1" if /([\w]+\.ngrok.io)/'`
      if [ -z "$BACKEND_URL" ]; then
        BACKEND_URL="backend-dev.unify.id"
        echo "--> No ngrok tunnel found; Shouldn't get that if using the docker-compose development setup."
      fi
  fi
fi

if [ "$NODE_ENV" = "production" ]; then
  if [ -z "$BACKEND_URL" ]; then
    BACKEND_URL="backend.unify.id"
  fi
fi

BACKEND_URL="https://$BACKEND_URL"

export NODE_ENV
export BACKEND_URL

echo "--> Building $NODE_ENV with backend \"$BACKEND_URL\""

browserify ./src/js/modals/app/app.module.js -t envify -o dist/app.verbose.js
uglifyjs ./dist/app.verbose.js -m -c --source-map ./dist/app.map -o ./dist/app.js

browserify ./src/js/content_script/content.js -t envify -o ./dist/content-bundle.verbose.js
uglifyjs ./dist/content-bundle.verbose.js -m -c --source-map ./dist/content-bundle.map -o dist/content-bundle.js

browserify ./src/js/background_script/background.js -t envify -o ./dist/event_page.verbose.js
uglifyjs ./dist/event_page.verbose.js -m -c --source-map ./dist/event_page.map -o dist/event_page.js

browserify ./src/js/modals/save_password.js -t envify -o ./dist/password_modal.verbose.js
uglifyjs ./dist/password_modal.verbose.js -m -c --source-map ./dist/password_modal.map -o dist/password_modal.js

browserify ./src/js/modals/challenge.js -t envify -o ./dist/challenge.verbose.js
uglifyjs ./dist/challenge.verbose.js -m -c --source-map ./dist/challenge.map -o dist/challenge.js

browserify ./src/js/action_script/browser_action.js -t envify -o ./dist/browser_action.verbose.js
uglifyjs ./dist/browser_action.verbose.js -m -c --source-map ./dist/browser_action.map -o dist/browser_action.js

rm ./dist/*.verbose.js