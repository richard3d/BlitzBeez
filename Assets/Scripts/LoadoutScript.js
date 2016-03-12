#pragma strict
class Pylon
{
	var AngOffset : float = 0;    //trajectory angle relative measured from the nose of the bee
	var AngRandomOffset : float = 0;    //amount of angle variation allowed +/-
	var PosOffset : Vector3; //position offset in local space
	var m_BulletInstance:GameObject = null;
	@HideInInspector
	var m_FireRateTimer:float = 0.01;
	var m_FireRate:float = 0;	//bullets are shot at this rate, 0.25 = 4 bullets per second
	var m_FireTime:float = 0; //the amount of time that must pass before we can fire another burst
	var m_FireDelay:float = 0; //the amount of time from when the user pulls the trigger till the first projectile is fired
	var m_BurstCount:int = 1; //when the trigger is pulled the gun will fire this many rounds at firerate
	@HideInInspector
	var m_BurstNum:int =0;
	@HideInInspector
	var m_CanShoot : boolean = true;
	
	//var m_PrevTime: float = 0;
	/*var m_Time : float = 0;
	
	var m_FireInterval : float;	//the amount of time that must pass between each bullet being shot (1/bullets per second)
	var m_BurstInterval :float; //the amount of time we continue to fire for each 
*/

	function Pylon(pos : Vector3, ang : float) { PosOffset = pos; AngOffset = ang; }
	function Pylon() { PosOffset = Vector3(0,0,0); AngOffset = 0; } 
	// function CanShoot():boolean {  
	
			// if((Time.time - m_PrevTime >= m_FireTime || m_BurstNum >= 0) && PosOffset != Vector3.zero)
			// {
				 // if(m_BurstNum <= 0)
				 // {
					// m_FireRateTimer = m_FireRate;
					 // m_BurstNum = m_BurstCount;
				 // }
				 // m_PrevTime = Time.time;
				// return true;
			// }		
			// // m_PrevTime = Time.time;
			// return false;
		// }
	// function IsShooting():boolean {
		
				// if(m_FireRateTimer > 0)
				// {
					// m_FireRateTimer -= Time.deltaTime;
					// if(m_FireRateTimer <= 0)
					// {
						// m_BurstNum -= 1;
						// if(m_BurstNum >= 0)
						// {
							// m_FireRateTimer = m_FireRate;
							
							// return true;
						// }
					// }
				// }
				
				// return false;
		
	// }
	
}

class LoadOut
{
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
				m_Pylons[0].m_BurstCount = 1;
				m_Pylons[0].PosOffset = Vector3(0, 0, 3);	
				m_Pylons[0].m_BulletInstance = Resources.Load("GameObjects/Bullet");
			
				
			break;
			
			
		}
	}
}