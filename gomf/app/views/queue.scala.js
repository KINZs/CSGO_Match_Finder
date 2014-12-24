@(implicit request: RequestHeader, roomId: String)

/**
 * ロビーのwebsocket関連
 */
$(function() {
    var socket = new WebSocket('@routes.Application.queue(roomId).webSocketURL()');

    var queueWS = {
        roomId: '@roomId',
        /**
         * queueを開始する
         * @@param playerCount プレイヤー人数
         * @@param maps マップ一覧
         */
        start: function(playerCount, maps) {
            if( maps.length === 0 ) {
                window.lobbyWS.onError("マップが指定されていません");
                //ボタンを初期状態に戻す
                window.queue.toggleBtn.text('GO');
                return;
            }

            //マッチング開始
            socket.send(JSON.stringify({
                event: "startQueue",
                playerCount: playerCount,
                maps: maps
            }));


        },
        /**
         * queueを停止する
         */
        stop: function() {
            if( socket.readyState !== 1 || socket === null ) return;

            socket.send(JSON.stringify({
                event: 'stopQueue'
            }));

        },
        /**
         * サーバーからのレスポンス時にコールされる
         * @@param res レスポンスデータ
         */
        onReceive: function(res) {
            var data = JSON.parse(res.data);
            console.dir(data);
            switch(data.event) {
                case 'matchingStart':
                    queueWS.onMatchingStart(data);
                break;
                case 'anyoneQuitQueue':
                    queueWS.onDisconnect(data);
                break;
                case 'matchFound':
                    queueWS.onMatchFound(data);
                break;
            }
        },
        /**
         * WebSocket通信切断時にコールされる
         */
        onConnectionClosed: function() {
            alert("サーバーとの通信が切断されました。ページを更新して再接続してください");
        },
        /**
         * ルームが切断された時にコールされる
         * @@param data
         */
        onDisconnect: function(data) {
            //切断したのがこのルームなら
            if( typeof data === 'undefined' || data.roomId === this.roomId ) {
                window.lobbyWS.onError("マッチングから切断されました");
                //ボタンを初期状態に戻す
                window.queue.toggleBtn.text('GO');
            }
        },
        /**
         * マッチング開始時にコールされる
         * @@param data JSONレスポンス
         */
        onMatchingStart: function(data) {
            if( data.roomId === this.roomId ) {
                window.lobbyWS.notify("マッチングを開始しました");
                //ボタンを初期状態に戻す
                window.queue.toggleBtn.text('CANCEL');
            }
        },
        /**
         * マッチが見つかった場合にコールされ、検証処理用の値をサーバーに返す
         * @@param data
         */
        onMatchFound: function(data) {
            //マッチングしたルーム一覧に自身のルームIDが存在する場合
            if( data.members.indexOf(this.roomId) ) {
                window.lobbyWS.notify("マッチが見つかりました");
                //ボタンを初期状態に戻す
                window.queue.toggleBtn.text('GO');
                //サーバーコネクトを送信
                location.href = 'steam://connect/' + data.serverAddress + ':' + data.serverPort + '/' + data.serverPassword;
            }
        }
    };
    //websocketのレスポンス処理メソッドに紐付け
    socket.onmessage = queueWS.onReceive;
    socket.onclose = queueWS.onConnectionClosed;
    //export
    window.queueWS = queueWS

});