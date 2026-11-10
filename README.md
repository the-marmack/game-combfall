# Combfall

An original falling-block browser game on a honeycomb. Clusters of hexagonal cells drift down into the comb; complete a
row to seal it and score. The game ends when the comb fills to the top.

Play it at <https://the-marmack.github.io/game-combfall/>. It needs no sign-in, and your best score and mute choice stay
in your browser.

## How to play

Guide each piece as it drifts down. A completed row seals: it is removed, the cells above settle, and the score goes up.
Sealing more rows at once scores more per row. The level rises as you seal rows, and each level drops pieces faster. The
game ends when a new piece cannot be placed.

| Action       | Keyboard    | Touch                      |
| ------------ | ----------- | -------------------------- |
| Move left    | Left arrow  | Left button or swipe left  |
| Move right   | Right arrow | Right button or swipe right |
| Rotate       | Up arrow    | Rotate button or tap       |
| Fall one row | Down arrow  |                            |
| Drop         | Space       | Drop button or swipe down  |
| Pause        | P           | Pause button               |

The page also has buttons to mute the sound and to start again.

## Run it

The game is static files with no build step and no dependencies. Serve the `web` folder and open the address it prints:

```sh
npx serve web
```

Run the tests with Node.js:

```sh
npm test
```

## Licence

[MIT](LICENSE)
