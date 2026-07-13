const ROOM_1 = {
    layout: [
        "##############################",
        "#                            #",
        "#                            #",
        "#          ###               #",
        "#                            #",
        "#    ###                     #",
        "#                            #",
        "#             ###            #",
        "#                            #", // exit on the right border
        "#     #########              #",
        "#                   #        #",
        "#                            #",
        "#              ##            #",
        "L        ###                 R",
        "L                   ###      R",
        "L                            R",
        "##############################"
    ],
    enemies: [],
    items: [],
    music: null,
    exits: {},     // no overrides — 'right' defaults to getAdjacentRoom([0,0], 'right') = [1,0]
    teleports: {},
};

const ROOM_2 = {
    layout: [
        "##############################",
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #", // matching exit on the left border, same row
        "#                            #",
        "#                            #",
        "#                            #",
        "#                            #",
        "L                            #",
        "L                            #",
        "L                            #",
        "##############################"
    ],
    enemies: [],
    items: [],
    music: null,
    exits: {},
    teleports: {},
};

const ROOM_3 = {
    layout: [
        "##############################",
        "#                            #",
        "#    #    # #    ## ##  # #  #",
        "#    #   # # #   # # #  # #  #",
        "#    #   #   #   # # #   #   #",
        "#    #    # #    #   #   #   #",
        "#    #     #     #   #   #   #",
        "#                            #",
        "#                            #", // matching exit on the left border, same row
        "#    #   # # ### ###         #",
        "#    #   # # #   #           #",
        "#    # # # # ##  ##          #",
        "#    # # # # #   #           #",
        "#     # #  # #   ###         R",
        "#                            R",
        "#                            R",
        "##############################"
    ],
    enemies: [],
    items: [],
    music: null,
    exits: {},
    teleports: {},
};

const MAP = {
    "0,0": ROOM_1,
    "1,0": ROOM_2,
    "-1,0": ROOM_3,
};

export function getRoom(room) {
    return MAP[`${room[0]},${room[1]}`];
}