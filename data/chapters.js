export const novelMeta={id:'thirty_first_cat',title:'三十一匹目の猫',source:'RETRACE_三十一匹目の猫_ZIP改稿.md',returnScene:'misaki_book_recommendation',chapters:8};
export const chapters=[
 ['一','終末の一日','ordo_city_blackout','news',0],
 ['二','古いパソコン','minato_room_night','cats',30],
 ['三','治らなかったもの','hospital_corridor','quiet',0],
 ['四','起源のない手紙','causality_room','causality',0],
 ['五','神様の帰る場所','minato_room_lamplight','cats',30],
 ['六','百分の三','assembly_hall','vote',0],
 ['七','最後の窓','minato_room_night','terminal',0],
 ['八','三十一匹目','minato_room_morning','cats',31]
].map(([number,title,background,pcMode,cats])=>({number,title,background,pcMode,cats,audioCue:null,effect:null,holdMs:0}));
// 本編接続前の仮会話。小説の正本とは分離して管理する。
export const introduction=[['美咲','ねえ拓海、これ読んだことある？'],['拓海','『三十一匹目の猫』？ 猫の話？'],['美咲','違う違う。AIと人間の話。私、これ大好きなんだよね'],['拓海','SFか'],['美咲','うん。でも好きなのは科学の説明だけじゃないんだ'],['拓海','何が好きなんだ？'],['美咲','それは最後まで読んでから。感想、聞かせてね']];
export const afterword=[['拓海','……最後の猫、あれは何だったんだ？'],['美咲','分からない。残った記録かもしれないし、ただの贈り物かもしれない'],['拓海','お前はどう思う？'],['美咲','オルドは、もういないと思う'],['拓海','じゃあ、どうして一匹増えた？'],['美咲','いなくなっても、残せるものってあるでしょ'],['拓海','……そうだな'],['美咲','拓海？ ちょっと泣きそう？'],['拓海','泣いてない'],['美咲','それもひとつの仮説だね！']];
