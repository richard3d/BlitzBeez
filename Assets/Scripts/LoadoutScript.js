#pragma strict
class Pylon
{
	var AngOffset : float = 0;    //trajectory angle relative measured from the nose of the bee
	var PosOffset : Vector3; //position offset in local space
	var m_BulletInstance:GameObject = null;
	var m_FireRateTimer:float = 0.01;
	var m_FireRate:float = 0;	//bullets are shot at this rate, 0.25 = 4 bullets per second
	var m_BurstCount:int = 1; //when the trigger is pulled the gun will fire this many rounds at firerate
	private var m_BurstNum:int =0;
	var m_FireTime:float = 0; //the amount of time that must pass before we can fire another burst
	var m_PrevTime: float = 0;
	/*var m_Time : float = 0;
	
	var m_FireInterval : float;	//the amount of time that must pass between each bullet being shot (1/bullets per second)
	var m_BurstInterval :float; //the amount of time we continue to fire for each 
*/
	function Pylon(pos : Vector3, ang : float) { PosOffset = pos; AngOffset = ang; }
	function Pylon() { PosOffset = Vector3(0,0,0); AngOffset = 0; } 
	function CanShoot():boolean {  
	
			if((Time.time - m_PrevTime >= m_FireTime || m_BurstNum > 0) && PosOffset != Vector3.zero)
			{
				 if(m_BurstNum <= 0)
				 {
					m_FireRateTimer = m_FireRate;
					 m_BurstNum = m_BurstCount;
				 }
				 m_PrevTime = Time.time;
				return true;
			}		
			return false;
		}
	function IsShooting():boolean {
		
				if(m_FireRateTimer > 0)
				{
					m_FireRateTimer -= Time.deltaTime;
					if(m_FireRateTimer <= 0)
					{
						m_BurstNum -= 1;
						if(m_BurstNum >= 0)
						{
							m_FireRateTimer = m_FireRate;
							
							return true;
						}
					}
				}
				
				return false;
		
	}
	
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
			m_Pylons[i] = new Pylon();
		}
		switch(type)
		{
			case -1:
				//| standard single fire shot
				m_BaseClipSize = 30;
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);	
				m_Pylons[0].m_FireRate = 0.1;
				m_Pylons[0].m_FireTime = 0.15;
				
			break;
			case 0:
				// || Twin Shot
				m_BaseClipSize = 10;
				
				m_Pylons[0].PosOffset = Vector3(-6, 0, 0);	
				m_Pylons[0].m_FireRate = 0.1;
				m_Pylons[0].m_FireTime = 0.15;
				
				m_Pylons[1].PosOffset = Vector3(6, 0, 0);
				m_Pylons[1].m_FireRate = 0.1;
				m_Pylons[1].m_FireTime = 0.15;
			break;
			case 1:
				// Triple Burst high velocity rounds
				m_BaseClipSize = 10;
				m_Pylons[0].m_BurstCount = 3;
				m_Pylons[0].m_FireRate = 0.1;
				m_Pylons[0].m_FireTime = 0.3;
				m_Pylons[0].AngOffset = 0;
				m_Pylons[0].PosOffset = Vector3(0,0,3);
				m_Pylons[0].m_BulletInstance = Resources.Load("GameObjects/VelocityBullet");
			break;
			case 2:
				// Spreadshot
				m_BaseClipSize = 5;
				m_Pylons[0].AngOffset = -8.0;
				m_Pylons[0].PosOffset = Vector3(-1, 0, 0);
				m_Pylons[0].m_FireRate = 0.1;
				m_Pylons[0].m_FireTime = 0.2;
				
				m_Pylons[1].AngOffset = 8.0;
				m_Pylons[1].PosOffset = Vector3(1, 0, 0);
				m_Pylons[1].m_FireRate = 0.1;
				m_Pylons[1].m_FireTime = 0.2;
				
				m_Pylons[2].PosOffset = Vector3(0, 0, 1);
				m_Pylons[2].m_FireRate = 0.1;
				m_Pylons[2].m_FireTime = 0.2;
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
				m_Pylons[3].AngOffset = 180;
				m_Pylons[3].PosOffset = Vector3(0, 0, -3);
			break;
			case 8:
				//Hydra shot (4 missiles plus double shot)
				m_BaseFireRate = 3.0;
				m_BaseClipSize = 20;
				
				m_Pylons[0].AngOffset = -15;
				m_Pylons[0].PosOffset = Vector3(-4, 0, 0);
				m_Pylons[0].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
				m_Pylons[0].m_FireRate = 0.1;
				
				m_Pylons[1].AngOffset = 15;
				m_Pylons[1].PosOffset = Vector3(4, 0, 0);
				m_Pylons[1].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
				m_Pylons[1].m_FireRate = 0.1;
				
				// m_Pylons[2].AngOffset = -135;
				// m_Pylons[2].PosOffset = Vector3(-4, 0, 0);
				// m_Pylons[2].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
				// m_Pylons[2].m_FireRate = 0.1;
				
				// m_Pylons[3].AngOffset = 135;
				// m_Pylons[3].PosOffset = Vector3(0, 0, -3);
				// m_Pylons[3].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
				// m_Pylons[3].m_FireRate = 0.1;
				
				//added twinshot
				m_Pylons[4].PosOffset = Vector3(-6, 0, 0);	
				m_Pylons[4].m_FireRate = 0.1;
				m_Pylons[4].m_FireTime = 0.15;
				
				m_Pylons[5].PosOffset = Vector3(6, 0, 0);
				m_Pylons[5].m_FireRate = 0.1;
				m_Pylons[5].m_FireTime = 0.15;
			break;
			 case 9:
				// // \||/
				m_BaseClipSize = 10;
				m_Pylons[0].PosOffset = Vector3(-9, 0, 0);
				m_Pylons[0].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
			//	m_Pylons[0].m_Time = 0.5;
				m_Pylons[1].PosOffset = Vector3(-6, 0, 0);
				m_Pylons[2].PosOffset = Vector3(6, 0, 0);
				m_Pylons[3].PosOffset = Vector3(9, 0, 0);
				m_Pylons[3].m_BulletInstance = Resources.Load("GameObjects/HomingBullet");
				//m_Pylons[3].m_Time = 0.5;
				m_Pylons[0].AngOffset = -10.5;
				m_Pylons[1].AngOffset = 0;
		
				m_Pylons[2].AngOffset = 0;
				m_Pylons[3].AngOffset = 10.5;
				
				m_Pylons[0].m_BurstCount = 2;
				m_Pylons[0].m_FireRate = 0.3;
				m_Pylons[0].m_FireTime = 1;
				
				m_Pylons[3].m_BurstCount = 2;
				m_Pylons[3].m_FireRate = 0.3;
				m_Pylons[3].m_FireTime = 1;
			break;
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