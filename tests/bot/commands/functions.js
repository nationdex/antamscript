module.exports = {
  type: "messageCreate",
  name: "functions",
  aliases: ["f"],
  code: `
    $c[ jseval cuz no file functions yet ]
    $jsonLoad[functions;$jsEval[require(process.cwd() + "metadata/functions.json")]]

    $sendMessage[$channelID;TODO]
    `,
};
