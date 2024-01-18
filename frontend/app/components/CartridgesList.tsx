import CartridgeSelectButton from './CartridgeSelectButton';
import { cache } from 'react';
import { cartridges as cartridgerequest} from "../backend-libs/app/lib";

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

const getCartridges = cache(async () => {
	const cartridges: any[] = (await cartridgerequest({},{decode:true})).data;
    // await delay(3000); // artificial fetch cartridges delay
    // const cartridges: any[] = [
    //     {id: 0, name: "Castlevania", cover: "nes_castlevania_cover.jpeg", date: "01/08/2024", desc: "Castlevania #"+desc},
    //     {id: 1, name: "Life Force",cover: "nes_lifeForce_cover.jpg", date: "01/08/2024", desc: "Life Force #"+desc},
    //     {id: 2, name: "The Legend of Zelda", cover: "nes_thelegendofzelda_cover.jpg", date: "01/08/2024", desc: "The Legend of Zelda #"+desc},
    //     {id: 3, name: "Castlevania", cover: "nes_castlevania_cover.jpeg", date: "01/08/2024", desc: "Castlevania #"+desc},
    //     {id: 4, name: "Life Force",cover: "nes_lifeForce_cover.jpg", date: "01/08/2024", desc: "Life Force #"+desc},
    //     {id: 5, name: "The Legend of Zelda", cover: "nes_thelegendofzelda_cover.jpg", date: "01/08/2024", desc: "The Legend of Zelda #"+desc},
    //     {id: 6, name: "Castlevania", cover: "nes_castlevania_cover.jpeg", date: "01/08/2024", desc: "Castlevania #"+desc},
    //     {id: 7, name: "Life Force",cover: "nes_lifeForce_cover.jpg", date: "01/08/2024", desc: "Life Force #"+desc},
    //     {id: 8, name: "The Legend of Zelda", cover: "nes_thelegendofzelda_cover.jpg", date: "01/08/2024", desc: "The Legend of Zelda #"+desc},
    //     {id: 9, name: "Castlevania", cover: "nes_castlevania_cover.jpeg", date: "01/08/2024", desc: "Castlevania #"+desc},
    //     {id: 10, name: "Life Force",cover: "nes_lifeForce_cover.jpg", date: "01/08/2024", desc: "Life Force #"+desc},
    //     {id: 11, name: "The Legend of Zelda", cover: "nes_thelegendofzelda_cover.jpg", date: "01/08/2024", desc: "The Legend of Zelda #"+desc},
    //     {id: 12, name: "Castlevania", cover: "nes_castlevania_cover.jpeg", date: "01/08/2024", desc: "Castlevania #"+desc},
    //     {id: 13, name: "Life Force",cover: "nes_lifeForce_cover.jpg", date: "01/08/2024", desc: "Life Force #"+desc},
    //     {id: 14, name: "The Legend of Zelda", cover: "nes_thelegendofzelda_cover.jpg", date: "01/08/2024", desc: "The Legend of Zelda #"+desc}
    // ]
    return cartridges;
  })

async function CartridgesList() {
    let cartridges = await getCartridges();

    return (
        <ul>
            {
                cartridges.map((cartridge: any, index: number) => {
                    return (
                        <li key={`${cartridge.name}-${index}`} className="flex">
                            <CartridgeSelectButton cartridge={cartridge} />
                        </li>
                    );
                })
            }
        </ul>
    )
}


export default CartridgesList