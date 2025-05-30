const path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    api: './src/ts/api.ts',
    auth: './src/ts/auth.ts',
    friends: './src/ts/friends.ts',
    websocket: './src/ts/websocket.ts',
    profile: './src/ts/profile.ts',
    'header-loader': './src/ts/header-loader.ts',
    'route-guard': './src/ts/route-guard.ts',
    index: './src/ts/index.ts',
    login: './src/ts/login.ts',
    register: './src/ts/register.ts',
    game: './src/ts/game.ts',
    'google-auth-handler': './src/ts/google-auth-handler.ts',
    'verify-2fa-login': './src/ts/verify-2fa-login.ts',
    tournament: './src/ts/tournament.ts',
    tournament_round: './src/ts/tournament_round.ts',
    tournamentService: './src/ts/tournamentService.ts',
    tournament_finish: './src/ts/tournament_finish.ts',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'src/js'),
  },
}; 