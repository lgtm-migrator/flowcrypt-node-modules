

export class Semaphore {

  private availableLocks: number;
  private name: string;
  private debug = false;

  constructor(poolSize: number, name = 'semaphore') {
    this.availableLocks = poolSize;
    this.name = name;
  }

  private wait = () => new Promise(resolve => setTimeout(resolve, 1000 + Math.round(Math.random() * 2000))); // wait 1-3s

  acquire = async () => {
    let i = 0;
    while (this.availableLocks < 1) {
      if (this.debug) {
        console.log(`[${this.name}] waiting for semaphore attempt ${i++}, now available: ${this.availableLocks}`);
      }
      await this.wait();
    }
    if (this.debug) {
      console.log(`[${this.name}] acquiring, semaphors available: ${this.availableLocks}`);
    }
    this.availableLocks--;
    if (this.debug) {
      console.log(`[${this.name}] acquired, now avaialbe: ${this.availableLocks}`);
    }
  }

  release = () => {
    if (this.debug) {
      console.log(`[${this.name}] releasing semaphore, previously available: ${this.availableLocks}`);
    }
    this.availableLocks++;
    if (this.debug) {
      console.log(`[${this.name}] released semaphore, now available: ${this.availableLocks}`);
    }
  }

}
