# This workflow will do a clean install of node dependencies, build the source code and run tests across different versions of node
# For more information see: https://help.github.com/actions/language-and-framework-guides/using-nodejs-with-github-actions  
# push:
#   branches: 
#   - master 

name: QQREAD

on:
  workflow_dispatch:
  schedule:
     - cron: '*/7 * * * *'
  watch:
     types: started
    
jobs:
  build:
    runs-on: ubuntu-latest
    if: github.event.repository.owner.id == github.event.sender.id
    steps:
      - uses: actions/checkout@v1
      - name: Use Node.js 10.x
        uses: actions/setup-node@v1
        with:
          node-version: 10.x
      - name: npm install
        run: |
          npm install
      - name: '运行 【qq阅读】'
        run: |
          node qqread.js
        env:
          cookieVal: ${{ secrets.TXNEWS4_COOKIE }}
          signurlVal: ${{ secrets.TXNEWS4_SIGN }}
          videoVal: ${{ secrets.TXNEWS4_VIDEO }}
          PUSH_KEY: ${{ secrets.PUSH_KEY }}
          BARK_PUSH: ${{ secrets.BARK_PUSH }}
