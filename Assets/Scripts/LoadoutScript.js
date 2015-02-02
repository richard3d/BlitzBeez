#pragma strict
class Pylon
{
	var AngOffset : float;    //trajectory angle relative measured from the nose of the bee
	var PosOffset : Vector3; //position offset in local space
	function Pylon(pos : Vector3, ang : float) { PosOffset = pos; AngOffset = ang; }
	function Pylon() { PosOffset = Vector3(0,0,0); AngOffset = 0; } 
}

class LoadOut
{
	
	var m_PowerShot : int = 0;
	var m_BaseFireRate:float = 6.5;
	var m_BaseReloadSpeed:float = 1.5; //(really the time for the reload)
	var m_BaseClipSize : int = 30;
	var m_Pylons : Pylon[];
	function LoadOut() { m_Pylons = new Pylon[8]; }
	function CreateLoadOut(type : int)
	{
		for(var i : int = 0; i < m_Pylons.length; i++)
		{
			m_Pylons[i].AngOffset = 0;
			m_Pylons[i].PosOffset = Vector3(0,0,0);
		}
		switch(type)
		{
			case -1:
				// |
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);	
			break;
			case 0:
				// ||
				m_BaseFireRate = 5.0;
				m_Pylons[0].PosOffset = Vector3(-3, 0, 0);	
				m_Pylons[1].PosOffset = Vector3(3, 0, 0);
			break;
			case 1:
				// |||
				m_BaseFireRate = 4.0;
				m_Pylons[0].PosOffset = Vector3(-6, 0, 0);
				m_Pylons[1].PosOffset = Vector3(6, 0, 0);
				m_Pylons[2].PosOffset = Vector3(0, 0, 1);
			break;
			case 2:
				// ||||
				m_BaseFireRate = 3.0;
				m_BaseClipSize = 20;
				m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				m_Pylons[1].PosOffset = Vector3(-3, 0, 0);
				m_Pylons[2].PosOffset = Vector3(3, 0, 0);
				m_Pylons[3].PosOffset = Vector3(9, 0, 0);
			break;
			case 3:
				// \/
				m_BaseFireRate = 5.0;
				m_Pylons[0].AngOffset = -5.0;
				m_Pylons[0].PosOffset = Vector3(-3, 0, 0);
				m_Pylons[1].AngOffset = 5.0;
				m_Pylons[1].PosOffset = Vector3(3, 0, 0);
			break;
			case 4:
				// \|/
				m_BaseFireRate = 4.0;
				m_Pylons[0].AngOffset = -8.0;
				m_Pylons[0].PosOffset = Vector3(-1, 0, 0);
				m_Pylons[1].AngOffset = 8.0;
				m_Pylons[1].PosOffset = Vector3(1, 0, 0);
				m_Pylons[2].PosOffset = Vector3(0, 0, 1);
			break;
			case 5:
				// \\//
				m_BaseFireRate = 3.0;
				m_BaseClipSize = 20;
				m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				m_Pylons[1].PosOffset = Vector3(-3, 0, 0);
				m_Pylons[2].PosOffset = Vector3(3, 0, 0);
				m_Pylons[3].PosOffset = Vector3(9, 0, 0);
				m_Pylons[0].AngOffset = -15.5;
				m_Pylons[1].AngOffset = -5.5;
				m_Pylons[2].AngOffset = 5.5;
				m_Pylons[3].AngOffset = 15.5;
			break;
			case 6:
				// |
				// |
				m_BaseFireRate = 5.0;
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);
				m_Pylons[0].AngOffset = 0;
				m_Pylons[1].PosOffset = Vector3(0, 0, -3);
				m_Pylons[1].AngOffset = 180;
				
				
			break;
			case 7:
				// _|_
				m_BaseFireRate = 4.0;
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);
				m_Pylons[1].AngOffset = 90;
				m_Pylons[1].PosOffset = Vector3(4, 0, 0);
				m_Pylons[2].AngOffset = -90;
				m_Pylons[2].PosOffset = Vector3(-4, 0, 0);
			break;
			case 8:
				// _|_
				//  |
				m_BaseFireRate = 3.0;
				m_BaseClipSize = 20;
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);
				m_Pylons[1].AngOffset = 90;
				m_Pylons[1].PosOffset = Vector3(4, 0, 0);
				m_Pylons[2].AngOffset = -90;
				m_Pylons[2].PosOffset = Vector3(-4, 0, 0);
				m_Pylons[3].AngOffset = 180;
				m_Pylons[3].PosOffset = Vector3(0, 0, -3);
				
				m_Pylons[4].AngOffset = -45;
				m_Pylons[4].PosOffset = Vector3(0, 0, 3);
				m_Pylons[5].AngOffset = 45;
				m_Pylons[5].PosOffset = Vector3(4, 0, 0);
				m_Pylons[6].AngOffset = -135;
				m_Pylons[6].PosOffset = Vector3(-4, 0, 0);
				m_Pylons[7].AngOffset = 135;
				m_Pylons[7].PosOffset = Vector3(0, 0, -3);
			break;
			// case 8:
				// // \||/
				// m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				// m_Pylons[1].PosOffset = Vector3(-2, 0, 0);
				// m_Pylons[2].PosOffset = Vector3(2, 0, 0);
				// m_Pylons[3].PosOffset = Vector3(9, 0, 0);
				// m_Pylons[0].AngOffset = -10.5;
				// m_Pylons[1].AngOffset = 0;
				// m_Pylons[2].AngOffset = 0;
				// m_Pylons[3].AngOffset = 10.5;
			// break;
			// case 9:
				// // ||||
				// //-    -
				// m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				// m_Pylons[1].PosOffset = Vector3(-3, 0, 0);
				// m_Pylons[2].PosOffset = Vector3(3, 0, 0);
				// m_Pylons[3].PosOffset = Vector3(9, 0, 0);
				
				// m_Pylons[4].PosOffset = Vector3(4, 0, 0);
				// m_Pylons[4].AngOffset = 90;
				// m_Pylons[5].PosOffset = Vector3(-4, 0, 0);
				// m_Pylons[5].AngOffset = -90;
			// break;
			// case 10:
				// // ||||
				// //  ||
				// m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				// m_Pylons[1].PosOffset = Vector3(-3, 0, 0);
				// m_Pylons[2].PosOffset = Vector3(3, 0, 0);
				// m_Pylons[3].PosOffset = Vector3(9, 0, 0);
				
				// m_Pylons[4].PosOffset = Vector3(-3, 0, -2);
				// m_Pylons[4].AngOffset = 180;
				// m_Pylons[5].PosOffset = Vector3(3, 0, -2);
				// m_Pylons[5].AngOffset = 180;
			// break;
			
		}
	}
}